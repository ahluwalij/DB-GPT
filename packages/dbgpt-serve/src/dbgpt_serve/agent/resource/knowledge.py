import dataclasses
import logging
from typing import Any, List, Optional, Type, cast

from dbgpt import SystemApp
from dbgpt.agent.resource.knowledge import (
    RetrieverResource,
    RetrieverResourceParameters,
)
from dbgpt.util import ParameterDescription
from dbgpt_serve.rag.retriever.knowledge_space import KnowledgeSpaceRetriever

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class KnowledgeSpaceLoadResourceParameters(RetrieverResourceParameters):
    space_name: str = dataclasses.field(
        default=None, metadata={"help": _("Knowledge space name")}
    )
    top_k: int = dataclasses.field(
        default=10, metadata={"help": _("Knowledge retriver top k")}
    )

    @classmethod
    def _resource_version(cls) -> str:
        """Return the resource version."""
        return "v1"

    @classmethod
    def to_configurations(
        cls,
        parameters: Type["KnowledgeSpaceLoadResourceParameters"],
        version: Optional[str] = None,
        **kwargs,
    ) -> Any:
        """Convert the parameters to configurations."""
        conf: List[ParameterDescription] = cast(
            List[ParameterDescription], super().to_configurations(parameters)
        )
        version = version or cls._resource_version()
        if version != "v1":
            return conf
        # Compatible with old version
        for param in conf:
            if param.param_name == "space_name":
                return param.valid_values or []
        return []

    @classmethod
    def from_dict(
        cls, data: dict, ignore_extra_fields: bool = True
    ) -> "KnowledgeSpaceLoadResourceParameters":
        """Create a new instance from a dictionary."""
        copied_data = data.copy()
        if "space_name" not in copied_data and "value" in copied_data:
            copied_data["space_name"] = copied_data.pop("value")
        return super().from_dict(copied_data, ignore_extra_fields=ignore_extra_fields)


class KnowledgeSpaceRetrieverResource(RetrieverResource):
    """Knowledge Space retriever resource."""

    def __init__(
        self,
        name: str,
        space_name: str,
        top_k: int = 10,
        system_app: SystemApp = None,
    ):
        # TODO: Build the retriever in a thread pool, it will block the event loop
        retriever = KnowledgeSpaceRetriever(
            space_id=space_name,
            top_k=top_k,
            system_app=system_app,
        )
        super().__init__(name, retriever=retriever)

        knowledge_spaces = get_knowledge_spaces_info(name=space_name)
        if knowledge_spaces is not None and len(knowledge_spaces) > 0:
            self._retriever_name = knowledge_spaces[0].name
            self._retriever_desc = knowledge_spaces[0].desc
        else:
            self._retriever_name = None
            self._retriever_desc = None

    @property
    def retriever_name(self) -> str:
        """Return the resource name."""
        return self._retriever_name

    @property
    def retriever_desc(self) -> str:
        """Return the retriever desc."""
        return self._retriever_desc

    @classmethod
    def resource_parameters_class(
        cls, **kwargs
    ) -> Type[KnowledgeSpaceLoadResourceParameters]:
        from dbgpt_app.knowledge.request.request import KnowledgeSpaceRequest
        from dbgpt_app.knowledge.service import KnowledgeService

        knowledge_space_service = KnowledgeService()
        knowledge_spaces = knowledge_space_service.get_knowledge_space(
            KnowledgeSpaceRequest(**kwargs)
        )
        results = [
            {"label": ks.name, "key": ks.name, "description": ks.desc}
            for ks in knowledge_spaces
        ]

        @dataclasses.dataclass
        class _DynamicKnowledgeSpaceLoadResourceParameters(
            KnowledgeSpaceLoadResourceParameters
        ):
            space_name: str = dataclasses.field(
                default=None,
                metadata={
                    "help": _("Knowledge space name"),
                    "valid_values": results,
                },
            )

        return _DynamicKnowledgeSpaceLoadResourceParameters


def get_knowledge_spaces_info(**kwargs):
    from dbgpt_app.knowledge.request.request import KnowledgeSpaceRequest
    from dbgpt_app.knowledge.service import KnowledgeService

    knowledge_space_service = KnowledgeService()
    knowledge_spaces = knowledge_space_service.get_knowledge_space(
        KnowledgeSpaceRequest(**kwargs)
    )

    return knowledge_spaces
