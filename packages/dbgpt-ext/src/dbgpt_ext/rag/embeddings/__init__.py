"""Module for embedding related classes and functions."""

from .aimlapi import AimlapiEmbeddings  # noqa: F401
from .jina import JinaEmbeddings  # noqa: F401
from .ollama import OllamaEmbeddings  # noqa: F401
from .qianfan import QianFanEmbeddings  # noqa: F401
from .siliconflow import SiliconFlowEmbeddings  # noqa: F401
from .tongyi import TongYiEmbeddings  # noqa: F401

__ALL__ = [
    "JinaEmbeddings",
    "OllamaEmbeddings",
    "QianFanEmbeddings",
    "TongYiEmbeddings",
    "SiliconFlowEmbeddings",
    "AimlapiEmbeddings",
]
