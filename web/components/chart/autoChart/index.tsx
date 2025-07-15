import { ChatContext } from '@/app/chat-context';
import { DownloadOutlined } from '@ant-design/icons';
import { Advice, Advisor, Datum } from '@antv/ava';
import { Chart, ChartRef } from '@berryv/g2-react';
import { Button, Col, Empty, Row, Select, Space, Tooltip } from 'antd';
import { compact, concat, uniq } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { downloadImage } from '../helpers/downloadChartImage';
import { customizeAdvisor, getVisAdvices } from './advisor/pipeline';
import { defaultAdvicesFilter } from './advisor/utils';
import { customCharts } from './charts';
import { processNilData, sortData } from './charts/util';
import { AutoChartProps, ChartType, CustomAdvisorConfig, CustomChart, Specification } from './types';
const { Option } = Select;

export const AutoChart = (props: AutoChartProps) => {
  const { data: originalData, chartType, scopeOfCharts, ruleConfig } = props;
  // Process null data (data marked as '-')
  const data = processNilData(originalData) as Datum[];
  const { mode } = useContext(ChatContext);

  const [advisor, setAdvisor] = useState<Advisor>();
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [renderChartType, setRenderChartType] = useState<ChartType>();
  const chartRef = useRef<ChartRef>();

  useEffect(() => {
    const input_charts: CustomChart[] = customCharts;
    const advisorConfig: CustomAdvisorConfig = {
      charts: input_charts,
      scopeOfCharts: {
        // Exclude area charts
        exclude: ['area_chart', 'stacked_area_chart', 'percent_stacked_area_chart'],
      },
      ruleConfig,
    };
    setAdvisor(customizeAdvisor(advisorConfig));
  }, [ruleConfig, scopeOfCharts]);

  /** Merge chart recommendations from AVA and model */
  const getMergedAdvices = (avaAdvices: Advice[]) => {
    if (!advisor) return [];
    const filteredAdvices = defaultAdvicesFilter({
      advices: avaAdvices,
    });
    const allChartTypes = uniq(
      compact(
        concat(
          chartType,
          avaAdvices.map(item => item.type),
        ),
      ),
    );
    const allAdvices = allChartTypes
      .map(chartTypeItem => {
        const avaAdvice = filteredAdvices.find(item => item.type === chartTypeItem);
        // If in AVA recommendation list, use the result from the recommendation list directly
        if (avaAdvice) {
          return avaAdvice;
        }
        // If not, generate chart spec for it separately
        const dataAnalyzerOutput = advisor.dataAnalyzer.execute({ data });
        if ('data' in dataAnalyzerOutput) {
          const specGeneratorOutput = advisor.specGenerator.execute({
            data: dataAnalyzerOutput.data,
            dataProps: dataAnalyzerOutput.dataProps,
            chartTypeRecommendations: [{ chartType: chartTypeItem, score: 1 }],
          });
          if ('advices' in specGeneratorOutput) return specGeneratorOutput.advices?.[0];
        }
      })
      .filter(advice => advice?.spec) as Advice[];
    return allAdvices;
  };

  useEffect(() => {
    if (data && advisor) {
      const avaAdvices = getVisAdvices({
        data,
        myChartAdvisor: advisor,
      });
      // Merge chart types recommended by model and ava
      const allAdvices = getMergedAdvices(avaAdvices);
      setAdvices(allAdvices);
      
      // Only set renderChartType if it's not already set or if the current selection is no longer valid
      const currentTypeExists = allAdvices.some(advice => advice.type === renderChartType);
      if (!renderChartType || !currentTypeExists) {
        setRenderChartType(allAdvices[0]?.type as ChartType);
      }
    }
  }, [JSON.stringify(data), advisor, chartType]);

  const visComponent = useMemo(() => {
    /* Advices exist, render the chart. */
    if (advices?.length > 0) {
      const chartTypeInput = renderChartType ?? advices[0].type;
      const spec: Specification = advices?.find((item: Advice) => item.type === chartTypeInput)?.spec ?? undefined;
      if (spec) {
        if (spec.data && ['line_chart', 'step_line_chart'].includes(chartTypeInput)) {
          // Handle sorting issues with ava built-in line charts
          const dataAnalyzerOutput = advisor?.dataAnalyzer.execute({ data });
          if (dataAnalyzerOutput && 'dataProps' in dataAnalyzerOutput) {
            spec.data = sortData({
              data: spec.data,
              xField: dataAnalyzerOutput.dataProps?.find((field: any) => field.recommendation === 'date'),
              chartType: chartTypeInput,
            });
          }
        }
        if (chartTypeInput === 'pie_chart' && spec?.encode?.color) {
          // Add pie chart tooltip title display
          spec.tooltip = { title: { field: spec.encode.color } };
        }
        return (
          <Chart
            key={chartTypeInput}
            options={{
              ...spec,
              autoFit: true,
              theme: mode,
              height: 300,
            }}
            ref={chartRef}
          />
        );
      }
    }
  }, [advices, mode, renderChartType]);

  // Helper function to get chart type name
  const getChartTypeName = (type: string) => {
    const chartNames: Record<string, string> = {
      bar_chart: 'Bar Chart',
      line_chart: 'Line Chart', 
      pie_chart: 'Pie Chart',
      area_chart: 'Area Chart',
      scatter_plot: 'Scatter Plot',
      multi_line_chart: 'Multi Line Chart',
      step_line_chart: 'Step Line Chart',
      column_chart: 'Column Chart',
      grouped_column_chart: 'Grouped Column Chart',
      stacked_column_chart: 'Stacked Column Chart',
      percent_stacked_column_chart: 'Percent Stacked Column Chart',
      grouped_bar_chart: 'Grouped Bar Chart',
      stacked_bar_chart: 'Stacked Bar Chart',
      percent_stacked_bar_chart: 'Percent Stacked Bar Chart',
      histogram: 'Histogram',
      density_plot: 'Density Plot',
      heatmap: 'Heatmap',
      donut_chart: 'Donut Chart',
      rose_chart: 'Rose Chart',
      box_plot: 'Box Plot',
      violin_plot: 'Violin Plot',
      radar_chart: 'Radar Chart',
      funnel_chart: 'Funnel Chart',
    };
    return chartNames[type] || type;
  };

  if (renderChartType) {
    return (
      <div>
        <Row justify='space-between' className='mb-2'>
          <Col>
            <Space>
              <span>Chart Type</span>
              <Select
                className='w-52'
                value={renderChartType}
                placeholder={'Chart Switcher'}
                onChange={value => setRenderChartType(value)}
                size={'small'}
              >
                {advices?.map(item => {
                  const name = getChartTypeName(item.type);
                  return (
                    <Option key={item.type} value={item.type}>
                      <Tooltip title={name} placement={'right'}>
                        <div>{name}</div>
                      </Tooltip>
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </Col>
          <Col>
            <Tooltip title="Download">
              <Button
                onClick={() => downloadImage(chartRef.current, getChartTypeName(renderChartType))}
                icon={<DownloadOutlined />}
                type='text'
              />
            </Tooltip>
          </Col>
        </Row>
        <div className='flex'>{visComponent}</div>
      </div>
    );
  }

  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No suitable visualization available'} />;
};

export * from './helpers';
