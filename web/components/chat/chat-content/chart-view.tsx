import { AutoChart, BackEndChartType, getChartType } from '@/components/chart/autoChart';
import { formatSql } from '@/utils';
import { Datum } from '@antv/ava';
import { Table, Tabs, TabsProps } from 'antd';
import { CodePreview } from './code-preview';

function ChartView({ data, type, sql }: { data: Datum[]; type: BackEndChartType; sql: string }) {
  const columns = data?.[0]
    ? Object.keys(data?.[0])?.map(item => {
        return {
          title: item,
          dataIndex: item,
          key: item,
        };
      })
    : [];
  const ChartItem = {
    key: 'chart',
    label: 'Chart',
    children: <AutoChart data={data} chartType={getChartType(type)} />,
  };
  const SqlItem = {
    key: 'sql',
    label: 'SQL',
    children: <CodePreview language='sql' code={formatSql(sql ?? '', 'mysql') as string} />,
  };
  const DataItem = {
    key: 'data',
    label: 'Data',
    children: <Table 
      dataSource={data} 
      columns={columns} 
      scroll={{ x: 'auto' }}
              rowKey={(record) => JSON.stringify(record)}
    />,
  };
  const TabItems: TabsProps['items'] = type === 'response_table' ? [DataItem, SqlItem] : [ChartItem, SqlItem, DataItem];

  return <Tabs defaultActiveKey={type === 'response_table' ? 'data' : 'chart'} items={TabItems} size='small' />;
}

export default ChartView;
