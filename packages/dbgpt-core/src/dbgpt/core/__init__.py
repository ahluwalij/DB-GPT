"""The core module contains the core interfaces and classes for dbgpt."""

# Add a simple no-op translation function to replace the removed i18n system
def _(text):
    """No-op translation function - just returns English text as-is."""
    return text

# Make it available globally
import builtins
builtins._ = _

from dbgpt.component import BaseComponent, SystemApp  # noqa: F401
from dbgpt.core.interface.cache import (  # noqa: F401
    CacheClient,
    CacheConfig,
    CacheKey,
    CachePolicy,
    CacheValue,
)
from dbgpt.core.interface.embeddings import (  # noqa: F401
    EmbeddingModelMetadata,
    Embeddings,
    RerankEmbeddings,
)
from dbgpt.core.interface.knowledge import Chunk, Document  # noqa: F401
from dbgpt.core.interface.llm import (  # noqa: F401
    DefaultMessageConverter,
    LLMClient,
    MessageConverter,
    ModelExtraMedata,
    ModelInferenceMetrics,
    ModelMetadata,
    ModelOutput,
    ModelRequest,
    ModelRequestContext,
)
from dbgpt.core.interface.message import (  # noqa: F401
    AIMessage,
    BaseMessage,
    ConversationIdentifier,
    HumanMessage,
    MessageIdentifier,
    MessageStorageItem,
    ModelMessage,
    ModelMessageRoleType,
    OnceConversation,
    StorageConversation,
    SystemMessage,
)
from dbgpt.core.interface.output_parser import (  # noqa: F401
    BaseOutputParser,
    SQLOutputParser,
)
from dbgpt.core.interface.prompt import (  # noqa: F401
    BasePromptTemplate,
    ChatPromptTemplate,
    HumanPromptTemplate,
    MessagesPlaceholder,
    PromptManager,
    PromptTemplate,
    StoragePromptTemplate,
    SystemPromptTemplate,
)
from dbgpt.core.interface.serialization import Serializable, Serializer  # noqa: F401
from dbgpt.core.interface.storage import (  # noqa: F401
    DefaultStorageItemAdapter,
    InMemoryStorage,
    QuerySpec,
    ResourceIdentifier,
    StorageError,
    StorageInterface,
    StorageItem,
    StorageItemAdapter,
)

__ALL__ = [
    "ModelInferenceMetrics",
    "ModelRequest",
    "ModelRequestContext",
    "ModelOutput",
    "ModelMetadata",
    "ModelMessage",
    "LLMClient",
    "ModelMessageRoleType",
    "ModelExtraMedata",
    "MessageConverter",
    "DefaultMessageConverter",
    "OnceConversation",
    "StorageConversation",
    "BaseMessage",
    "SystemMessage",
    "AIMessage",
    "HumanMessage",
    "MessageStorageItem",
    "ConversationIdentifier",
    "MessageIdentifier",
    "PromptTemplate",
    "PromptManager",
    "StoragePromptTemplate",
    "BasePromptTemplate",
    "ChatPromptTemplate",
    "MessagesPlaceholder",
    "SystemPromptTemplate",
    "HumanPromptTemplate",
    "BaseOutputParser",
    "SQLOutputParser",
    "Serializable",
    "Serializer",
    "CacheKey",
    "CacheValue",
    "CacheClient",
    "CachePolicy",
    "CacheConfig",
    "ResourceIdentifier",
    "StorageItem",
    "StorageItemAdapter",
    "StorageInterface",
    "InMemoryStorage",
    "DefaultStorageItemAdapter",
    "QuerySpec",
    "StorageError",
    "EmbeddingModelMetadata",
    "Embeddings",
    "RerankEmbeddings",
    "Chunk",
    "Document",
]
