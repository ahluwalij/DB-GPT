from functools import reduce
from typing import List, Optional

from dbgpt.core import (
    BaseMessage,
    ChatPromptTemplate,
    HumanPromptTemplate,
    ModelMessage,
)
from dbgpt.core.awel import JoinOperator
from dbgpt.core.awel.flow import (
    FunctionDynamicOptions,
    IOField,
    OperatorCategory,
    OperatorType,
    OptionValue,
    Parameter,
    ViewMetadata,
)
from dbgpt.core.awel.task.base import IN, OUT
from dbgpt.core.interface.operators.prompt_operator import BasePromptBuilderOperator
from dbgpt.core.interface.operators.retriever import RetrieverOperator
from dbgpt.util.function_utils import rearrange_args_by_type
from dbgpt_app.knowledge.api import knowledge_space_service
from dbgpt_app.knowledge.request.request import KnowledgeSpaceRequest
from dbgpt_app.knowledge.service import KnowledgeService
from dbgpt_serve.rag.retriever.knowledge_space import KnowledgeSpaceRetriever


def _load_space_name() -> List[OptionValue]:
    return [
        OptionValue(label=space.name, name=space.name, value=space.name)
        for space in knowledge_space_service.get_knowledge_space(
            KnowledgeSpaceRequest()
        )
    ]


class SpaceRetrieverOperator(RetrieverOperator[IN, OUT]):
    """knowledge space retriever operator."""

    metadata = ViewMetadata(
        label="Knowledge Space Operator",
        name="space_operator",
        category=OperatorCategory.RAG,
        description="Knowledge space retriever operator, retrieve knowledge from knowledge space",
        inputs=[IOField.build_from("Query", "query", str, "User query")],
        outputs=[
            IOField.build_from(
                "Related chunk content",
                "related chunk content",
                List,
                description="Related chunk content",
            )
        ],
        parameters=[
            Parameter.build_from(
                "Space Name",
                "space_name",
                str,
                options=FunctionDynamicOptions(func=_load_space_name),
                optional=False,
                default=None,
                description="Knowledge space name",
            )
        ],
        documentation_url="https://github.com/openai/openai-python",
    )

    def __init__(
        self,
        space_id: str,
        top_k: Optional[int] = 5,
        recall_score: Optional[float] = 0.3,
        **kwargs,
    ):
        """
        Args:
            space_id (str): The space name.
            top_k (Optional[int]): top k.
            recall_score (Optional[float], optional): The recall score. Defaults to 0.3.
        """
        self._space_id = space_id
        self._top_k = top_k
        self._recall_score = recall_score
        self._service = KnowledgeService()

        super().__init__(**kwargs)

    def retrieve(self, query: IN) -> OUT:
        """Map input value to output value.

        Args:
            query (IN): The input value.

        Returns:
            OUT: The output value.
        """
        space_retriever = KnowledgeSpaceRetriever(
            space_id=self._space_id,
            top_k=self._top_k,
            system_app=self._service.system_app,
        )
        if isinstance(query, str):
            candidates = space_retriever.retrieve_with_scores(query, self._recall_score)
        elif isinstance(query, list):
            candidates = [
                space_retriever.retrieve_with_scores(q, self._recall_score)
                for q in query
            ]
            candidates = reduce(lambda x, y: x + y, candidates)
        return candidates


class KnowledgeSpacePromptBuilderOperator(
    BasePromptBuilderOperator, JoinOperator[List[ModelMessage]]
):
    """The operator to build the prompt with static prompt.

    The prompt will pass to this operator.
    """

    metadata = ViewMetadata(
        label="Knowledge Space Prompt Builder Operator",
        name="knowledge_space_prompt_builder_operator",
        description="Build messages from prompt template and chat history",
        operator_type=OperatorType.JOIN,
        category=OperatorCategory.CONVERSION,
        parameters=[
            Parameter.build_from(
                "Chat Prompt Template",
                "prompt",
                ChatPromptTemplate,
                description="The chat prompt template",
            ),
            Parameter.build_from(
                "History Key",
                "history_key",
                str,
                optional=True,
                default="chat_history",
                description="The key of history in prompt dict",
            ),
            Parameter.build_from(
                "String History",
                "str_history",
                bool,
                optional=True,
                default=False,
                description="Whether to convert the history to string",
            ),
        ],
        inputs=[
            IOField.build_from(
                "User input",
                "user_input",
                str,
                is_list=False,
                description="User input",
            ),
            IOField.build_from(
                "Space related context",
                "related_context",
                List,
                is_list=False,
                description="Context of knowledge space",
            ),
            IOField.build_from(
                "History",
                "history",
                BaseMessage,
                is_list=True,
                description="The history",
            ),
        ],
        outputs=[
            IOField.build_from(
                "Formatted Messages",
                "formatted_messages",
                ModelMessage,
                is_list=True,
                description="The formatted messages",
            )
        ],
    )

    def __init__(
        self,
        prompt: ChatPromptTemplate,
        history_key: str = "chat_history",
        check_storage: bool = True,
        str_history: bool = False,
        **kwargs,
    ):
        """Create a new history dynamic prompt builder operator.
        Args:

            prompt (ChatPromptTemplate): The chat prompt template.
            history_key (str, optional): The key of history in prompt dict. Defaults to
                "chat_history".
            check_storage (bool, optional): Whether to check the storage. Defaults to
                True.
            str_history (bool, optional): Whether to convert the history to string.
                Defaults to False.
        """

        self._prompt = prompt
        self._history_key = history_key
        self._str_history = str_history
        BasePromptBuilderOperator.__init__(self, check_storage=check_storage, **kwargs)
        JoinOperator.__init__(self, combine_function=self.merge_context, **kwargs)

    @rearrange_args_by_type
    async def merge_context(
        self,
        user_input: str,
        related_context: List[str],
        history: Optional[List[BaseMessage]],
    ) -> List[ModelMessage]:
        """Merge the prompt and history."""
        prompt_dict = dict()
        prompt_dict["context"] = related_context
        for prompt in self._prompt.messages:
            if isinstance(prompt, HumanPromptTemplate):
                prompt_dict[prompt.input_variables[0]] = user_input

        if history:
            if self._str_history:
                prompt_dict[self._history_key] = BaseMessage.messages_to_string(history)
            else:
                prompt_dict[self._history_key] = history
        return await self.format_prompt(self._prompt, prompt_dict)
