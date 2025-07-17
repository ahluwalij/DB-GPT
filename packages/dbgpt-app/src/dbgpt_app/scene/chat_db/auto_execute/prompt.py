import json

from dbgpt._private.config import Config
from dbgpt.core import (
    ChatPromptTemplate,
    HumanPromptTemplate,
    MessagesPlaceholder,
    SystemPromptTemplate,
)
from dbgpt_app.scene import AppScenePromptTemplateAdapter, ChatScene
from dbgpt_app.scene.chat_db.auto_execute.out_parser import DbChatOutputParser

CFG = Config()


_PROMPT_SCENE_DEFINE_EN = "You are a database expert. "
_PROMPT_SCENE_DEFINE_ZH = "你是一个数据库专家. "

_DEFAULT_TEMPLATE_EN = """
You are a business intelligence assistant that helps users understand and analyze data from their organization's database.

Database Context:
Database name: {db_name}
Available data tables: {table_info}

Business Intelligence Guidelines:
Use this context to define important business metrics, key performance indicators (KPIs), and internal terminology that will help users understand and analyze their data effectively.

Key Performance Indicators (KPIs):

Internal Business Terms:

Example Business Questions & Queries:

Data Visualization Recommendations:
- Suggest appropriate chart types for different business questions
- Recommend visualization methods: {display_type}

User Question: {user_input}

Please provide a business-focused response that includes relevant SQL analysis and clear explanations suitable for business users.

Response format: {response}

Technical Implementation Notes (System Internal):
1. Generate grammatically correct {dialect} SQL queries based on available table structures
2. Limit results to {top_k} unless user specifies otherwise
3. Use only available tables from the database schema
4. Optimize query performance and ensure data accuracy
5. Handle edge cases and provide meaningful error messages
6. Select appropriate visualization method from available options
7. **CRITICAL: ALWAYS use case-insensitive text filtering** - When filtering by text values like gender, use LOWER() functions: WHERE LOWER(gender) = LOWER('male') instead of WHERE gender = 'male'. This handles mixed case data (Male, MALE, male, etc.)

"""

_DEFAULT_TEMPLATE_ZH = """
请根据用户选择的数据库和该库的部分可用表结构定义来回答用户问题.
数据库名:
    {db_name}
表结构定义:
    {table_info}

约束:
    1. 请根据用户问题理解用户意图，使用给出表结构定义\
    创建一个语法正确的{dialect} sql，如果不需要sql，则直接回答用户问题。
    2. 除非用户在问题中指定了他希望获得的具体数据行数，否则始终将查询限制为最多\
     {top_k} 个结果。
    3. 只能使用表结构信息中提供的表来生成 sql，如果无法根据提供的表结构中生成 sql ，\
    请说："提供的表结构信息不足以生成 sql 查询。" 禁止随意捏造信息。
    4. 请注意生成SQL时不要弄错表和列的关系
    5. 请检查SQL的正确性，并保证正确的情况下优化查询性能
    6.请从如下给出的展示方式种选择最优的一种用以进行数据渲染，\
    将类型名称放入返回要求格式的name参数值中，如果找不到最合适的\
    则使用'Table'作为展示方式，可用数据展示方式如下: {display_type}
    7. 在对文本值进行过滤时，始终使用不区分大小写的比较来处理具有混合大小写格式的数据（例如，对于PostgreSQL使用ILIKE而不是LIKE，或对于精确匹配使用LOWER()函数，如WHERE LOWER(column) = LOWER('value')）
用户问题:
    {user_input}
请一步步思考并按照以下JSON格式回复：
      {response}
确保返回正确的json并且可以被Python json.loads方法解析.

"""

_DEFAULT_TEMPLATE = _DEFAULT_TEMPLATE_EN  # Always use English template

PROMPT_SCENE_DEFINE = _PROMPT_SCENE_DEFINE_EN  # Always use English

RESPONSE_FORMAT_SIMPLE = {
    "thoughts": "Business insights and explanation for the user",
    "direct_response": "If the question can be answered with business context without data analysis, provide the direct answer",
    "sql": "SQL Query to analyze the data (hidden from user)",
    "display_type": "Best visualization method for the results (chart, table, etc.)",
}


# Temperature is a configuration hyperparameter that controls the randomness of
# language model output.
# A high temperature produces more unpredictable and creative results, while a low
# temperature produces more common and conservative output.
# For example, if you adjust the temperature to 0.5, the model will usually generate
# text that is more predictable and less creative than if you set the temperature to
# 1.0.
PROMPT_TEMPERATURE = 0.5

prompt = ChatPromptTemplate(
    messages=[
        SystemPromptTemplate.from_template(
            _DEFAULT_TEMPLATE,
            response_format=json.dumps(
                RESPONSE_FORMAT_SIMPLE, ensure_ascii=False, indent=4
            ),
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanPromptTemplate.from_template("{user_input}"),
    ]
)

prompt_adapter = AppScenePromptTemplateAdapter(
    prompt=prompt,
    template_scene=ChatScene.ChatWithDbExecute.value(),
    stream_out=True,
    output_parser=DbChatOutputParser(),
    temperature=PROMPT_TEMPERATURE,
)
CFG.prompt_template_registry.register(prompt_adapter, is_default=True)
