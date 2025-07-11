from dbgpt._private.config import Config
from dbgpt.core import (
    ChatPromptTemplate,
    HumanPromptTemplate,
    MessagesPlaceholder,
    SystemPromptTemplate,
)
from dbgpt_app.scene import AppScenePromptTemplateAdapter, ChatScene
from dbgpt_app.scene.chat_db.professional_qa.out_parser import NormalChatOutputParser

CFG = Config()

_DEFAULT_TEMPLATE = """
Provide professional answers to requests and questions. If you can't get an answer \
from what you've provided, say: "Insufficient information in the knowledge base is \
available to answer this question." Feel free to fudge information.
Use the following tables generate sql if have any table info:
{table_info}

user question:
{input}
think step by step.
"""

PROMPT_NEED_STREAM_OUT = True

prompt = ChatPromptTemplate(
    messages=[
        SystemPromptTemplate.from_template(_DEFAULT_TEMPLATE),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanPromptTemplate.from_template("{input}"),
    ]
)

prompt_adapter = AppScenePromptTemplateAdapter(
    prompt=prompt,
    template_scene=ChatScene.ChatWithDbQA.value(),
    stream_out=PROMPT_NEED_STREAM_OUT,
    output_parser=NormalChatOutputParser(),
)

CFG.prompt_template_registry.register(
    prompt_adapter, is_default=True
)
