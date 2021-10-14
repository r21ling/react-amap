import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

import * as echarts from 'echarts';

const DrillDownLayer = ({ onChage, onClick, onReady }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const locateBreadcrumbRef = useRef();
  const isReady = useRef(false);

  const drawMap = ({ level = 'country', target = '中国' } = {}) => {
    const district = new AMap.DistrictSearch({
      showbiz: false,
      subdistrict: 0, //获取边界不需要返回下级行政区
      extensions: 'base',
      level,
    });
    const isCountry = level === 'country';

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

            const parentFeature = areaNode.getParentFeature();
            // 处理全国时的群岛
            const targetSelfGeoFeatures = isCountry
              ? Object.assign({}, parentFeature, {
                  ...parentFeature,
                  geometry: {
                    ...parentFeature.geometry,
                    coordinates: parentFeature.geometry.coordinates.slice(
                      0,
                      20
                    ),
                  },
                })
              : parentFeature;

            const mapJSON = {
              type: 'FeatureCollection',
              features,
            };
            echarts.registerMap(target, mapJSON);
            const geoData = features.map((item) => item.properties);

            chartRef.current.clear();
            chartRef.current.setOption({
              geo: {
                show: true,
                roam: true,
                map: target,
                regions: geoData,
                scaleLimit: {
                  min: 1,
                  max: 11,
                },
                itemStyle: {
                  areaColor: 'transparent',
                  borderColor: '#25A8F6',
                  borderWidth: 1,
                },
                label: {
                  show: true,
                  color: '#fff',
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
                    show: true,
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
              },
              series: [
                {
                  type: 'lines',
                  coordinateSystem: 'geo',
                  data: targetSelfGeoFeatures.geometry.coordinates
                    .flat()
                    .map((item) => ({
                      coords: item,
                    })),
                  polyline: true,
                  large: true,
                  lineStyle: {
                    color: '#25A8F6',
                    width: 3,
                  },
                },
                {
                  type: 'lines',
                  coordinateSystem: 'geo',
                  data: [
                    targetSelfGeoFeatures.geometry.coordinates
                      .flat()
                      .map((item) => ({
                        coords: item,
                      }))[0],
                  ],
                  polyline: true,
                  large: true,
                  lineStyle: {
                    color: '#25A8F6',
                    width: 3,
                  },
                  effect: {
                    show: true,
                    trailLength: 0.2,
                    symbolSize: 4,
                    constantSpeed: 80,
                    color: 'red',
                  },
                },
              ],
            });

            if (!isReady.current) {
              isReady.current = true;
              onReady?.(chartRef.current);
            }
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
        chartRef.current.on('click', (params) => {
          const { componentType, region } = params;
          if (componentType === 'geo') {
            if (onClick?.(params) === false) {
              return;
            }
            if (region?.level === 'district') {
              return;
            }
            drawMap({
              level: region.level,
              target: region.name,
            });
          }
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
