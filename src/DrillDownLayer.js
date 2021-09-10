import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

import * as echarts from 'echarts';

const DrillDownLayer = ({ onChage }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const prevAreaRef = useRef();
  const currentAreaRef = useRef();

  const drawMap = ({
    level = 'country',
    target = '中国',
    method = 'down'
  } = {}) => {
    const district = new AMap.DistrictSearch({
      showbiz: false,
      subdistrict: 0, //获取边界不需要返回下级行政区
      extensions: 'base',
      level
    });

    district.search(target, function(status, result) {
      if (status !== 'complete') {
        return;
      }
      const { districtList } = result;
      AMapUI.loadUI(['geo/DistrictExplorer'], DistrictExplorer => {
        const districtExplorer = new DistrictExplorer();
        districtExplorer.loadAreaNode(
          districtList[0].adcode,
          (error, areaNode) => {
            if (error) {
              console.error(error);
              return;
            }
            const features = areaNode.getSubFeatures();
            console.log(method, target, prevAreaRef.current?.name, features);
            const mapJSON = {
              type: 'FeatureCollection',
              features
            };
            echarts.registerMap(target, mapJSON);
            const geoData = features.map(item => item.properties);

            chartRef.current.setOption({
              // tooltip: {
              //   trigger: 'item'
              // },
              geo: {
                show: false,
                map: target
              },
              series: [
                // {
                //   name: 'Top5',
                //   type: 'effectScatter',
                //   coordinateSystem: 'geo',
                //   data: [
                //     {
                //       name: '广东省',
                //       value: 20
                //     }
                //   ],
                //   symbolSize: 20,
                //   showEffectOn: 'emphasis',
                //   rippleEffect: {
                //     brushType: 'stroke'
                //   },
                //   label: {
                //     formatter: '{b}',
                //     position: 'right',
                //     show: true
                //   },
                //   itemStyle: {
                //     color: '#f4e925',
                //     shadowBlur: 10,
                //     shadowColor: '#333'
                //   },
                //   zlevel: 1
                // },
                {
                  type: 'effectScatter', //点
                  coordinateSystem: 'geo',
                  showEffectOn: 'render',
                  zlevel: 1,
                  rippleEffect: { period: 1, scale: 4, brushType: 'fill' },
                  itemStyle: {
                    normal: {
                      color: '#1DE9B6',
                      shadowBlur: 10,
                      shadowColor: '#333'
                    }
                  },
                  symbolSize: 5,
                  data: [{ value: [118.8062, 31.9208] }]
                },
                {
                  zoom: 1,
                  name: 'amap',
                  type: 'map',
                  // roam: true,
                  map: target,
                  itemStyle: {
                    borderWidth: 2,
                    shadowOffsetY: 4,
                    shadowOffsetX: 4,
                    shadowBlur: 10,
                    areaColor: 'transparent',
                    borderColor: '#25A8F6'
                  },
                  label: {
                    // show: true,
                    color: '#fff',
                    // position: ['10%', '50%']
                    fontSize: 8
                  },
                  // emphasis: {
                  //   itemStyle: {
                  //     borderColor: '#25A8F6',
                  //     borderWidth: 1,
                  //     areaColor: 'transparent',
                  //     shadowColor: 'rgba(0, 0, 0, 0)',
                  //     shadowBlur: 0,
                  //     shadowOffsetX: 0,
                  //     shadowOffsetY: 1
                  //   },
                  //   label: {
                  //     show: true,
                  //     color: '#fff'
                  //   }
                  // },
                  data: geoData
                }
              ]
            });
          }
        );
      });
    });
  };

  useEffect(() => {
    chartRef.current = echarts.init(containerRef.current);
    chartRef.current.getZr().on('dblclick', params => {
      drawMap({
        method: 'up',
        level: prevAreaRef.current.level,
        target: prevAreaRef.current.name
      });
    });
    AMapLoader.load({
      key: 'dda3607ed8d2e71b44f3f96f1f3463ce', // 申请好的Web端开发者Key，首次调用 load 时必填
      version: '1.4.15', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ['AMap.DistrictSearch'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
      AMapUI: {
        // 是否加载 AMapUI，缺省不加载
        version: '1.1', // AMapUI 缺省 1.1
        plugins: ['geo/DistrictExplorer'] // 需要加载的 AMapUI ui插件
      }
    })
      .then(() => {
        chartRef.current.on('click', { seriesName: 'amap' }, params => {
          // chartRef.current.on('click', 'geo', params => {
          const { data } = params;
          if (data?.level === 'district') {
            return;
          }
          drawMap({
            level: data.level,
            target: data.name
          });
        });

        drawMap();
      })
      .catch(e => {
        console.error(e);
      });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        with: 400,
        height: 400,
        background: 'pink'
      }}
    />
  );
};

export default DrillDownLayer;
