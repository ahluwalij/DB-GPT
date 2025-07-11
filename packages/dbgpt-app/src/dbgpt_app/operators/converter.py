"""Type Converter Operators."""

from dbgpt.core import ModelOutput
from dbgpt.core.awel import MapOperator
from dbgpt.core.awel.flow import (
    TAGS_ORDER_HIGH,
    IOField,
    OperatorCategory,
    Parameter,
    ViewMetadata,
)

_INPUTS_STRING = IOField.build_from(
    "String",
    "string",
    str,
    description="The string to be converted to other types.",
)
_INPUTS_INTEGER = IOField.build_from(
    "Integer",
    "integer",
    int,
    description="The integer to be converted to other types.",
)
_INPUTS_FLOAT = IOField.build_from(
    "Float",
    "float",
    float,
    description="The float to be converted to other types.",
)
_INPUTS_BOOLEAN = IOField.build_from(
    "Boolean",
    "boolean",
    bool,
    description="The boolean to be converted to other types.",
)

_OUTPUTS_STRING = IOField.build_from(
    "String",
    "string",
    str,
    description="The string converted from other types.",
)
_OUTPUTS_INTEGER = IOField.build_from(
    "Integer",
    "integer",
    int,
    description="The integer converted from other types.",
)
_OUTPUTS_FLOAT = IOField.build_from(
    "Float",
    "float",
    float,
    description="The float converted from other types.",
)
_OUTPUTS_BOOLEAN = IOField.build_from(
    "Boolean",
    "boolean",
    bool,
    description="The boolean converted from other types.",
)


class StringToInteger(MapOperator[str, int]):
    """Converts a string to an integer."""

    metadata = ViewMetadata(
        label="String to Integer",
        name="default_converter_string_to_integer",
        description="Converts a string to an integer.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[_INPUTS_STRING],
        outputs=[_OUTPUTS_INTEGER],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new StringToInteger operator."""
        super().__init__(map_function=lambda x: int(x), **kwargs)


class StringToFloat(MapOperator[str, float]):
    """Converts a string to a float."""

    metadata = ViewMetadata(
        label="String to Float",
        name="default_converter_string_to_float",
        description="Converts a string to a float.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[_INPUTS_STRING],
        outputs=[_OUTPUTS_FLOAT],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new StringToFloat operator."""
        super().__init__(map_function=lambda x: float(x), **kwargs)


class StringToBoolean(MapOperator[str, bool]):
    """Converts a string to a boolean."""

    metadata = ViewMetadata(
        label="String to Boolean",
        name="default_converter_string_to_boolean",
        description="Converts a string to a boolean, true: 'true', '1', 'y'",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[
            Parameter.build_from(
                "True Values",
                "true_values",
                str,
                optional=True,
                default="true,1,y",
                description="Comma-separated values that should be treated as True.",
            )
        ],
        inputs=[_INPUTS_STRING],
        outputs=[_OUTPUTS_BOOLEAN],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, true_values: str = "true,1,y", **kwargs):
        """Create a new StringToBoolean operator."""
        true_values_list = true_values.split(",")
        true_values_list = [x.strip().lower() for x in true_values_list]
        super().__init__(map_function=lambda x: x.lower() in true_values_list, **kwargs)


class IntegerToString(MapOperator[int, str]):
    """Converts an integer to a string."""

    metadata = ViewMetadata(
        label="Integer to String",
        name="default_converter_integer_to_string",
        description="Converts an integer to a string.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[_INPUTS_INTEGER],
        outputs=[_OUTPUTS_STRING],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new IntegerToString operator."""
        super().__init__(map_function=lambda x: str(x), **kwargs)


class FloatToString(MapOperator[float, str]):
    """Converts a float to a string."""

    metadata = ViewMetadata(
        label="Float to String",
        name="default_converter_float_to_string",
        description="Converts a float to a string.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[_INPUTS_FLOAT],
        outputs=[_OUTPUTS_STRING],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new FloatToString operator."""
        super().__init__(map_function=lambda x: str(x), **kwargs)


class BooleanToString(MapOperator[bool, str]):
    """Converts a boolean to a string."""

    metadata = ViewMetadata(
        label="Boolean to String",
        name="default_converter_boolean_to_string",
        description="Converts a boolean to a string.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[_INPUTS_BOOLEAN],
        outputs=[_OUTPUTS_STRING],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new BooleanToString operator."""
        super().__init__(map_function=lambda x: str(x), **kwargs)


class ModelOutputToDict(MapOperator[ModelOutput, dict]):
    """Converts a model output to a dictionary."""

    metadata = ViewMetadata(
        label="Model Output to Dict",
        name="default_converter_model_output_to_dict",
        description="Converts a model output to a dictionary.",
        category=OperatorCategory.TYPE_CONVERTER,
        parameters=[],
        inputs=[IOField.build_from("Model Output", "model_output", ModelOutput)],
        outputs=[IOField.build_from("Dictionary", "dict", dict)],
        tags={"order": TAGS_ORDER_HIGH},
    )

    def __init__(self, **kwargs):
        """Create a new ModelOutputToDict operator."""
        super().__init__(map_function=lambda x: x.to_dict(), **kwargs)
