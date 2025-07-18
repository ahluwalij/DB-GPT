import json
import logging
import xml.etree.ElementTree as ET
from typing import Dict, NamedTuple

import numpy as np
import pandas as pd
import sqlparse

from dbgpt._private.config import Config
from dbgpt.core.interface.output_parser import BaseOutputParser
from dbgpt.util.json_utils import serialize

from ...exceptions import AppActionException

CFG = Config()


class SqlAction(NamedTuple):
    sql: str
    thoughts: Dict
    display: str
    direct_response: str

    def to_dict(self) -> Dict[str, Dict]:
        return {
            "sql": self.sql,
            "thoughts": self.thoughts,
            "display": self.display,
            "direct_response": self.direct_response,
        }


logger = logging.getLogger(__name__)


class DbChatOutputParser(BaseOutputParser):
    def __init__(self, is_stream_out: bool = False, **kwargs):
        super().__init__(is_stream_out=is_stream_out, **kwargs)

    def is_sql_statement(self, statement):
        parsed = sqlparse.parse(statement)
        if not parsed:
            return False
        for stmt in parsed:
            if stmt.get_type() != "UNKNOWN":
                return True
        return False

    def parse_prompt_response(self, model_out_text):
        clean_str = super().parse_prompt_response(model_out_text)
        logger.info(f"clean prompt response: {clean_str}")
        
        # Enhanced logging for debugging non-deterministic behavior
        logger.info(f"🔍 DEBUGGING: Raw model output length: {len(model_out_text)}")
        logger.info(f"🔍 DEBUGGING: Clean response length: {len(clean_str)}")
        
        # Compatible with community pure sql output model
        if self.is_sql_statement(clean_str):
            logger.info("🔍 DEBUGGING: Detected pure SQL statement")
            return SqlAction(clean_str, "", "", "")
        else:
            try:
                response = json.loads(clean_str, strict=False)
                sql = ""
                thoughts = dict
                display = ""
                resp = ""
                
                # Enhanced logging for JSON parsing
                logger.info(f"🔍 DEBUGGING: JSON keys found: {list(response.keys())}")
                
                for key in sorted(response):
                    if key.strip() == "sql":
                        sql = response[key]
                    if key.strip() == "thoughts":
                        thoughts = response[key]
                    if key.strip() == "display_type":
                        display = response[key]
                    if key.strip() == "direct_response":
                        resp = response[key]
                
                # Critical debugging: Log if SQL is empty or if direct_response contains failure message
                if not sql or sql.strip() == "":
                    logger.error(f"🚨 CRITICAL: Empty SQL generated! Direct response: {resp}")
                    logger.error(f"🚨 CRITICAL: Thoughts: {thoughts}")
                    # Check if this is a false rejection (LLM incorrectly saying insufficient info)
                    if resp and ("not enough" in resp.lower() or "insufficient" in resp.lower()):
                        logger.error(f"🚨 CRITICAL: False rejection detected! LLM incorrectly claimed insufficient info")
                        # This is where we could implement retry logic in the future
                        
                # Use the same logging pattern as the existing logs that ARE showing up
                logger.info(f"🔍 GENDER DEBUG: Final SQL: {sql}")
                logger.info(f"🔍 GENDER DEBUG: Final thoughts: {thoughts}")
                logger.info(f"🔍 GENDER DEBUG: Final display: {display}")
                logger.info(f"🔍 GENDER DEBUG: Final response: {resp}")
                
                # Check specifically for gender-related queries
                if sql and ("gender" in sql.lower() or "male" in sql.lower() or "female" in sql.lower()):
                    logger.info(f"🚨 GENDER QUERY DETECTED: {sql}")
                    if "lower(" not in sql.lower():
                        logger.info(f"🚨 CASE-SENSITIVE QUERY DETECTED: SQL does not use LOWER() function!")
                        logger.info(f"🚨 THIS IS THE ROOT CAUSE: Database has 'Male' but query uses 'male'")
                    else:
                        logger.info(f"✅ CASE-INSENSITIVE QUERY: SQL correctly uses LOWER() function")
                
                return SqlAction(
                    sql=sql, thoughts=thoughts, display=display, direct_response=resp
                )
            except Exception as e:
                logger.error(f"🚨 CRITICAL: JSON load failed: {clean_str}")
                logger.error(f"🚨 CRITICAL: Exception: {str(e)}")
                return SqlAction("", clean_str, "", "")

    def parse_vector_data_with_pca(self, df):
        try:
            from sklearn.decomposition import PCA
        except ImportError:
            raise ImportError(
                "Could not import scikit-learn package. "
                "Please install it with `pip install scikit-learn`."
            )

        nrow, ncol = df.shape
        if nrow == 0 or ncol == 0:
            return df, False

        vec_col = -1
        for i_col in range(ncol):
            if isinstance(df.iloc[:, i_col][0], list):
                vec_col = i_col
                break
            elif isinstance(df.iloc[:, i_col][0], bytes):
                sample = df.iloc[:, i_col][0]
                if isinstance(json.loads(sample.decode()), list):
                    vec_col = i_col
                    break
        if vec_col == -1:
            return df, False
        vec_dim = len(json.loads(df.iloc[:, vec_col][0].decode()))
        if min(nrow, vec_dim) < 2:
            return df, False
        df.iloc[:, vec_col] = df.iloc[:, vec_col].apply(
            lambda x: json.loads(x.decode())
        )
        X = np.array(df.iloc[:, vec_col].tolist())

        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X)

        new_df = pd.DataFrame()
        for i_col in range(ncol):
            if i_col == vec_col:
                continue
            col_name = df.columns[i_col]
            new_df[col_name] = df[col_name]
        new_df["__x"] = [pos[0] for pos in X_pca]
        new_df["__y"] = [pos[1] for pos in X_pca]
        return new_df, True

    def parse_view_response(self, speak, data, prompt_response) -> str:
        param = {}
        api_call_element = ET.Element("chart-view")
        err_msg = None
        success = False
        try:
            # Handle direct response (no SQL needed - just conversational)
            if prompt_response.direct_response and (not prompt_response.sql or len(prompt_response.sql) <= 0):
                speak = prompt_response.direct_response
                view_json_str = ""
                success = True
            # Handle SQL response
            elif prompt_response.sql:
                df = data(prompt_response.sql)
                param["type"] = prompt_response.display

                if param["type"] == "response_vector_chart":
                    df, visualizable = self.parse_vector_data_with_pca(df)
                    param["type"] = (
                        "response_scatter_chart" if visualizable else "response_table"
                    )

                param["sql"] = prompt_response.sql
                param["data"] = json.loads(
                    df.to_json(orient="records", date_format="iso", date_unit="s")
                )
                view_json_str = json.dumps(param, default=serialize, ensure_ascii=False)
                success = True
            # No response at all - this is the error case
            else:
                raise AppActionException("No SQL or direct response found", speak)
        except Exception as e:
            logger.error("parse_view_response error!" + str(e))
            err_param = {
                "sql": f"{prompt_response.sql}",
                "type": "response_table",
                "data": [],
            }
            # err_param["err_msg"] = str(e)
            err_msg = str(e)
            view_json_str = json.dumps(err_param, default=serialize, ensure_ascii=False)

        # api_call_element.text = view_json_str
        if len(view_json_str) != 0:
            api_call_element.set("content", view_json_str)
            result = ET.tostring(api_call_element, encoding="utf-8")
        else:
            result = b""
        if not success:
            view_content = (
                f'{speak} \\n <span style="color:red">ERROR!</span>'
                f"{err_msg} \n {result.decode('utf-8')}"
            )
            raise AppActionException("Generate view content failed", view_content)
        else:
            return speak + "\n" + result.decode("utf-8")
