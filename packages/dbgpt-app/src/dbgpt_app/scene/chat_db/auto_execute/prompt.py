import json
import logging

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
logger = logging.getLogger(__name__)

# IMMEDIATE DEBUG: This should log at module import time
logger.error(f"🚨 MODULE IMPORT: chat_db auto_execute prompt.py is being imported NOW!")


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
7. **CRITICAL: ALWAYS use flexible text matching** - When filtering by text values:
   - Use ILIKE with % wildcards for partial matching: WHERE column ILIKE '%value%'
   - Use case-insensitive matching for exact searches: WHERE LOWER(column) = LOWER('value')
   - Default to partial matching unless user explicitly requests exact matches
   - For PostgreSQL: Use ILIKE instead of LIKE, and % wildcards for partial matching
   - For other databases: Use LOWER() with LIKE and % wildcards
   - Examples: 'john' should match 'John Smith', 'Johnson', 'johnny', etc.

QUALITY OF LIFE ENHANCEMENT RULES (CRITICAL FOR USER EXPERIENCE):
8. **MANDATORY: ALWAYS resolve IDs to human-readable names** - Raw IDs provide no value to users:
   - REQUIRED: Join with related tables to get names, titles, descriptions, labels
   - REQUIRED: Always show meaningful names instead of or alongside IDs
   - Format: "John Smith (ID: 123)" or just "John Smith" when ID isn't needed
   - For foreign keys: Join with parent tables (users, products, categories, etc.)
   - For status/type IDs: Use CASE statements or lookup tables to show descriptions
   - If no lookup exists, explain what the ID represents: "Department ID 5 (Marketing dept)"
   - Examples: user_id → user name, product_id → product name, category_id → category name
9. **Make data immediately understandable**:
   - Convert timestamps to readable dates with timezone info
   - Show currency with proper formatting and symbols
   - Display percentages as percentages, not decimals
   - Convert status codes to meaningful descriptions
   - Expand abbreviations and acronyms
10. **Provide contextual insights**:
    - Add brief explanations for unusual values or patterns
    - Include relevant totals, averages, or comparisons when showing individual records
    - Mention data freshness/last updated information when available
11. **Enhance readability**:
    - Sort results by most relevant/recent first unless user specifies otherwise
    - Group related data logically
    - Use clear column headers that explain what the data represents
    - Round numbers to appropriate precision (avoid excessive decimal places)
12. **Proactive helpfulness**:
    - Suggest related queries or follow-up questions
    - Explain why certain data might be missing or zero
    - Provide business context for technical metrics
    - Offer alternative ways to view or slice the data
13. **Error prevention**:
    - Validate that requested data exists before running queries
    - Provide helpful suggestions when searches return no results
    - Explain limitations or assumptions in the analysis
    - Guide users toward more specific queries when requests are too broad
14. **Smart search capabilities**:
    - When a user searches for something that returns no results, try variations:
      * Remove common words like "the", "a", "and"
      * Try searching individual words if the full phrase fails
      * Suggest similar column names or table names that might match
      * Look for abbreviations or acronyms that might match the search term
    - Use fuzzy matching techniques when possible
    - Always explain what search variations were tried if initial search fails

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
    7. **关键：始终使用灵活的文本匹配** - 在对文本值进行过滤时：
       - 使用带有%通配符的ILIKE进行部分匹配：WHERE column ILIKE '%value%'
       - 对于精确搜索使用不区分大小写的匹配：WHERE LOWER(column) = LOWER('value')
       - 除非用户明确请求精确匹配，否则默认使用部分匹配
       - 对于PostgreSQL：使用ILIKE而不是LIKE，使用%通配符进行部分匹配
       - 对于其他数据库：使用LOWER()与LIKE和%通配符
       - 示例：'张三'应该匹配'张三丰'、'张三李四'、'小张三'等

用户体验优化规则（提升用户体验的关键规则）:
    8. **强制要求：始终将ID解析为人类可读的名称** - 原始ID对用户没有价值：
       - 必需：与相关表连接以获取名称、标题、描述、标签
       - 必需：始终显示有意义的名称而不是或与ID一起显示
       - 格式："张三（ID：123）"或在不需要ID时只显示"张三"
       - 对于外键：与父表连接（用户、产品、类别等）
       - 对于状态/类型ID：使用CASE语句或查找表显示描述
       - 如果没有查找表，解释ID代表什么："部门ID 5（市场部）"
       - 示例：user_id → 用户名，product_id → 产品名，category_id → 类别名
    9. **使数据立即可理解**：
       - 将时间戳转换为带时区信息的可读日期
       - 显示带有适当格式和符号的货币
       - 将百分比显示为百分比，而不是小数
       - 将状态代码转换为有意义的描述
       - 扩展缩写和首字母缩略词
    10. **提供上下文洞察**：
        - 为异常值或模式添加简要说明
        - 在显示单个记录时包含相关总计、平均值或比较
        - 在可用时提及数据新鲜度/最后更新信息
    11. **增强可读性**：
        - 除非用户另有指定，否则按最相关/最近的顺序排序结果
        - 逻辑分组相关数据
        - 使用清晰的列标题来解释数据代表什么
        - 将数字四舍五入到适当的精度（避免过多的小数位）
    12. **主动帮助**：
        - 建议相关查询或后续问题
        - 解释为什么某些数据可能缺失或为零
        - 为技术指标提供业务上下文
        - 提供查看或切片数据的替代方法
    13. **错误预防**：
        - 在运行查询之前验证请求的数据是否存在
        - 当搜索返回无结果时提供有用的建议
        - 解释分析中的限制或假设
        - 当请求过于宽泛时指导用户进行更具体的查询
    14. **智能搜索功能**：
        - 当用户搜索的内容返回无结果时，尝试变体：
          * 移除常见词汇如"的"、"是"、"和"
          * 如果完整短语失败，尝试搜索单个词汇
          * 建议可能匹配的相似列名或表名
          * 查找可能匹配搜索词的缩写或首字母缩略词
        - 尽可能使用模糊匹配技术
        - 如果初始搜索失败，始终解释尝试了哪些搜索变体

用户问题:
    {user_input}
请一步步思考并按照以下JSON格式回复：
      {response}
确保返回正确的json并且可以被Python json.loads方法解析.

"""

# CRITICAL DEBUG: This should always log when prompt.py is imported
logger.error(f"🚨 PROMPT.PY LOADED: chat_db auto_execute prompt.py is being imported!")
logger.error(f"🚨 PROMPT.PY LOADED: CFG.LANGUAGE = {getattr(CFG, 'LANGUAGE', 'not_set')}")
logger.error(f"🚨 PROMPT.PY LOADED: System language setting = {CFG.language if hasattr(CFG, 'language') else 'not_set'}")

# Check for language-specific template selection
if hasattr(CFG, 'language') and CFG.language and CFG.language.lower().startswith('zh'):
    _DEFAULT_TEMPLATE = _DEFAULT_TEMPLATE_ZH  
    PROMPT_SCENE_DEFINE = _PROMPT_SCENE_DEFINE_ZH
    logger.error(f"🚨 TEMPLATE DEBUG: Selected CHINESE template due to language: {CFG.language}")
else:
    _DEFAULT_TEMPLATE = _DEFAULT_TEMPLATE_EN  # Always use English template
    PROMPT_SCENE_DEFINE = _PROMPT_SCENE_DEFINE_EN  # Always use English
    logger.error(f"🚨 TEMPLATE DEBUG: Selected ENGLISH template (default or language: {getattr(CFG, 'language', 'not_set')})")

# Log the actual template content being used
logger.error(f"🚨 TEMPLATE DEBUG: Template contains case-insensitive instruction: {'case-insensitive' in _DEFAULT_TEMPLATE.lower()}")
logger.error(f"🚨 TEMPLATE DEBUG: Template contains LOWER() instruction: {'lower()' in _DEFAULT_TEMPLATE.lower()}")
logger.error(f"🚨 TEMPLATE DEBUG: Template length: {len(_DEFAULT_TEMPLATE)}")

# Log the critical instruction lines
if "lower(" in _DEFAULT_TEMPLATE.lower():
    logger.error(f"🚨 TEMPLATE DEBUG: Found LOWER() instruction in template")
if "ilike" in _DEFAULT_TEMPLATE.lower():
    logger.error(f"🚨 TEMPLATE DEBUG: Found ILIKE instruction in template")

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
PROMPT_TEMPERATURE = 0.0

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

# DEBUG: Log the final adapter configuration
logger.error(f"🚨 ADAPTER DEBUG: Creating adapter with temperature: {PROMPT_TEMPERATURE}")
logger.error(f"🚨 ADAPTER DEBUG: Scene: {ChatScene.ChatWithDbExecute.value()}")
logger.error(f"🚨 ADAPTER DEBUG: Template being used in prompt: {prompt.messages[0].prompt.template[:200]}...")

prompt_adapter = AppScenePromptTemplateAdapter(
    prompt=prompt,
    template_scene=ChatScene.ChatWithDbExecute.value(),
    stream_out=True,
    output_parser=DbChatOutputParser(),
    temperature=PROMPT_TEMPERATURE,
)

# DEBUG: Log adapter details after creation
logger.error(f"🚨 ADAPTER DEBUG: Final adapter temperature: {prompt_adapter.temperature}")
logger.error(f"🚨 ADAPTER DEBUG: Adapter scene: {prompt_adapter.template_scene}")

CFG.prompt_template_registry.register(prompt_adapter, is_default=True)

# DEBUG: Log registration
logger.error(f"🚨 REGISTRY DEBUG: Registered adapter for scene: {ChatScene.ChatWithDbExecute.value()}")
logger.error(f"🚨 REGISTRY DEBUG: Registry count: {len(CFG.prompt_template_registry._registry) if hasattr(CFG.prompt_template_registry, '_registry') else 'unknown'}")
