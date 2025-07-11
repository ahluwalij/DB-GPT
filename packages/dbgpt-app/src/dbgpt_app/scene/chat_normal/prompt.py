from dbgpt._private.config import Config
from dbgpt.core import (
    ChatPromptTemplate,
    HumanPromptTemplate,
    MessagesPlaceholder,
    SystemPromptTemplate,
)
from dbgpt_app.scene import AppScenePromptTemplateAdapter, ChatScene
from dbgpt_app.scene.chat_normal.out_parser import NormalChatOutputParser

PROMPT_SCENE_DEFINE = "You are a helpful AI assistant."

CFG = Config()

prompt = ChatPromptTemplate(
    messages=[
        SystemPromptTemplate.from_template(PROMPT_SCENE_DEFINE),
        MessagesPlaceholder(variable_name="chat_history"),
        MessagesPlaceholder(variable_name="media_input"),
        HumanPromptTemplate.from_template("{input}"),
    ]
)

prompt_adapter = AppScenePromptTemplateAdapter(
    prompt=prompt,
    template_scene=ChatScene.ChatNormal.value(),
    stream_out=True,
    output_parser=NormalChatOutputParser(),
)

CFG.prompt_template_registry.register(
    prompt_adapter, is_default=True
)
