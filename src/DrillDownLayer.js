import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

import * as echarts from 'echarts';

const DrillDownLayer = ({ onChage }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const locateBreadcrumbRef = useRef();

  const drawMap = ({ level = 'country', target = '中国' } = {}) => {
    const district = new AMap.DistrictSearch({
      showbiz: false,
      subdistrict: 0, //获取边界不需要返回下级行政区
      extensions: 'base',
      level,
    });

    district.search(target, function (status, result) {
      if (status !== 'complete') {
        return;
      }
      const { districtList } = result;
      AMapUI.loadUI(['geo/DistrictExplorer'], (DistrictExplorer) => {
        const districtExplorer = new DistrictExplorer();
        districtExplorer.loadAreaNode(
          districtList[0].adcode,
          (error, areaNode) => {
            if (error) {
              console.error(error);
              return;
            }
            const features = areaNode
              .getSubFeatures()
              .filter((item) => item.properties.name !== '三沙市')
              .map((item) => {
                if (item.properties.name === '海南省') {
                  return {
                    ...item,
                    geometry: {
                      ...item.geometry,
                      coordinates: item.geometry.coordinates.slice(0, 1),
                    },
                  };
                }
                return {
                  ...item,
                  properties: {
                    ...item.properties,
                    name: item.properties.name.replace(
                      /省|市|自治区|特别行政区|壮族|回族|维吾尔/g,
                      ''
                    ),
                  },
                };
              });
            const areaProps = areaNode.getProps();
            // 记录当前路径
            districtExplorer.locatePosition(
              areaProps.center,
              (error, routeFeatures) => {
                const roteIndexMap = {
                  country: 1,
                  province: 2,
                  city: 3,
                };
                locateBreadcrumbRef.current = routeFeatures
                  .slice(0, roteIndexMap[areaProps.level])
                  .map((area) => area.properties);

                onChage?.(locateBreadcrumbRef.current, areaProps);
              }
            );
            const mapJSON = {
              type: 'FeatureCollection',
              features,
            };
            echarts.registerMap(target, mapJSON);
            const geoData = features.map((item) => item.properties);
            chartRef.current.setOption({
              // tooltip: {
              //   trigger: 'item'
              // },
              geo: {
                show: false,
                map: target,
                // roam: 'scale',
              },
              series: [
                // {
                //   type: 'effectScatter', //点
                //   coordinateSystem: 'geo',
                //   showEffectOn: 'render',
                //   zlevel: 1,
                //   rippleEffect: { period: 1, scale: 4, brushType: 'fill' },
                //   itemStyle: {
                //     normal: {
                //       color: '#1DE9B6',
                //       shadowBlur: 10,
                //       shadowColor: '#333',
                //     },
                //   },
                //   symbolSize: 5,
                //   data: [{ value: [118.8062, 31.9208] }],
                // },
                {
                  name: 'amap',
                  type: 'map',
                  // roam: 'scale',
                  map: target,
                  itemStyle: {
                    borderWidth: 2,
                    shadowOffsetY: 4,
                    shadowOffsetX: 4,
                    shadowBlur: 10,
                    areaColor: 'transparent',
                    color: 'transparent',
                    borderColor: '#25A8F6',
                  },
                  label: {
                    // show: true,
                    color: '#fff',
                    fontSize: 8,
                  },
                  emphasis: {
                    itemStyle: {
                      borderColor: '#25A8F6',
                      borderWidth: 1,
                      areaColor: 'transparent',
                      shadowColor: 'rgba(0, 0, 0, 0)',
                      shadowBlur: 0,
                      shadowOffsetX: 0,
                      shadowOffsetY: 1,
                    },
                    label: {
                      color: '#fff',
                    },
                  },
                  select: {
                    itemStyle: {
                      areaColor: 'transparent',
                    },
                    label: {
                      show: false,
                    },
                  },
                  data: geoData,
                },
              ],
            });
          }
        );
      });
    });
  };

  useEffect(() => {
    chartRef.current = echarts.init(containerRef.current);
    // 双击返回上一层
    chartRef.current.getZr().on('dblclick', () => {
      const targetIndex = locateBreadcrumbRef.current?.length - 2;
      const target =
        locateBreadcrumbRef.current?.[targetIndex <= 0 ? 0 : targetIndex];
      if (target.level === 'country') {
        drawMap();
      } else {
        drawMap({
          level: target.level,
          target: target.name,
        });
      }
    });
    AMapLoader.load({
      key: 'dda3607ed8d2e71b44f3f96f1f3463ce', // 申请好的Web端开发者Key，首次调用 load 时必填
      version: '1.4.15', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ['AMap.DistrictSearch'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
      AMapUI: {
        // 是否加载 AMapUI，缺省不加载
        version: '1.1', // AMapUI 缺省 1.1
        plugins: ['geo/DistrictExplorer'], // 需要加载的 AMapUI ui插件
      },
    })
      .then(() => {
        chartRef.current.on('click', { seriesName: 'amap' }, (params) => {
          const { data } = params;
          if (data?.level === 'district') {
            return;
          }
          drawMap({
            level: data.level,
            target: data.name,
          });
        });
        drawMap();
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        with: 400,
        height: 400,
        background: 'pink',
      }}
    />
  );
};

export default DrillDownLayer;
