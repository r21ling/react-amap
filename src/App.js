import React, { useRef } from 'react';
import DrillDownLayer from './DrillDownLayer';

export default function App() {
  const chartRef = useRef();

  return (
    <DrillDownLayer
      onReady={(chart) => {
        chartRef.current = chart;
      }}
      onChage={(_list, current) => {
        if (current.level === 'country') {
          chartRef.current.setOption({
            series: [
              {
                id: 'effectScatter',
                type: 'effectScatter', //点
                coordinateSystem: 'geo',
                showEffectOn: 'render',
                zlevel: 1,
                rippleEffect: { period: 1, scale: 4, brushType: 'fill' },
                itemStyle: {
                  normal: {
                    color: '#1DE9B6',
                    shadowBlur: 10,
                    shadowColor: '#333',
                  },
                },
                symbolSize: 5,
                data: [{ value: [118.8062, 31.9208] }],
              },
            ],
          });
        } else {
          // chartRef.current.setOption({
          //   series: [
          //     {
          //       id: 'effectScatter',
          //       data: [],
          //     },
          //   ],
          // });
        }
      }}
      onClick={(params) => {
        if (params?.region?.name === '广东') {
          return false;
        }
      }}
    />
  );
}
