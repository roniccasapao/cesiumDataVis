var mapCreateUtil = (function () {

    function getImageryModels() {
        var imageryViewModels = [];

        imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'CartoDB Positron',
            iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/Positron.png'),
            tooltip: 'http://www.openstreetmap.org/copyright \
                        http://cartodb.com/attributions" ',
            creationFunction: function () {
                return Cesium.createOpenStreetMapImageryProvider({
                    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
                });
            }
        }));

        imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'Open\u00adStreet\u00adMap',
            iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
            tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable \
                    map of the world.\nhttp://www.openstreetmap.org',
            creationFunction: function () {
                return Cesium.createOpenStreetMapImageryProvider({
                    url: 'https://a.tile.openstreetmap.org/'
                });
            }
        }));

        imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'Dark Map',
            iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/darkMap.png'),
            creationFunction: function () {
                return Cesium.createOpenStreetMapImageryProvider({
                    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
                });
            }
        }));

        imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'Black Marble',
            iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/blackMarble.png'),
            tooltip: 'The lights of cities and villages trace the outlines of civilization \
                    in this global view of the Earth at night as seen by NASA/NOAA\'s Suomi NPP satellite.',
            creationFunction: function () {
                return Cesium.createTileMapServiceImageryProvider({
                    url: 'https://cesiumjs.org/blackmarble',
                    credit: 'Black Marble imagery courtesy NASA Earth Observatory',
                    flipXY: true
                });
            }
        }));

        imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'Natural Earth\u00a0II',
            iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/naturalEarthII.png'),
            tooltip: 'Natural Earth II, darkened for contrast.\nhttp://www.naturalearthdata.com/',
            creationFunction: function () {
                return Cesium.createTileMapServiceImageryProvider({
                    url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
                });
            }
        }));

        return imageryViewModels;
    }

    return {

        getImageryModels: getImageryModels

    };
})();


var mapDataUtil = (function () {
    function plotPoints(viewer, tradeInfo) {

        tradeInfo.forEach(function (element) {
            viewer.entities.add({
                name: element.ptTitle,
                position: Cesium.Cartesian3.fromDegrees(
                    element.partnerCoordinates[1], //long
                    element.partnerCoordinates[0]), //lat
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.DODGERBLUE,
                    scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
                }
            });
        });
    }

    function createPath(viewer, tradeInfo) {
        tradeInfo.forEach(function (element) {
            // if (element.ptTitle == "Neth. Antilles") {
            //     console.log(element);
            // }

            var startLon = element.reporterCoordinates[1];
            var startLat = element.reporterCoordinates[0];

            viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

            var startTime = viewer.clock.startTime;
            var midTime = Cesium.JulianDate.addSeconds(startTime, 43200, new Cesium.JulianDate());
            var stopTime = Cesium.JulianDate.addSeconds(startTime, 86400, new Cesium.JulianDate());

            var color = Cesium.Color.ORANGERED;
            var stopLon = element.partnerCoordinates[1];
            var stopLat = element.partnerCoordinates[0];


            // Create a straight-line path.
            var property = new Cesium.SampledPositionProperty();
            var startPosition = Cesium.Cartesian3.fromDegrees(startLon, startLat, 0);
            property.addSample(startTime, startPosition);


            var stopPosition = Cesium.Cartesian3.fromDegrees(stopLon, stopLat, 0);
            property.addSample(stopTime, stopPosition);

            // Find the midpoint of the straight path, and raise its altitude.
            var midPoint = Cesium.Cartographic.fromCartesian(property.getValue(midTime));
            midPoint.height = Cesium.Math.nextRandomNumber() * 500000 + 2500000;
            var midPosition = viewer.scene.globe.ellipsoid.cartographicToCartesian(
                midPoint, new Cesium.Cartesian3());

            // Redo the path to be the new arc.
            property = new Cesium.SampledPositionProperty();
            property.addSample(startTime, startPosition);
            property.addSample(midTime, midPosition);
            property.addSample(stopTime, stopPosition);

            // Create an Entity to show the arc.
            var arcEntity = viewer.entities.add({
                name: element.rtTitle + "-" + element.ptTitle,
                position: property,
                path: {
                    resolution: 1200,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.16,
                        color: color
                    }),
                    width: 10,
                    leadTime: 1e10,
                    trailTime: 1e10
                }
            });

            var tradeValue = helpers.formatNumbersWithCommas(element.TradeValue);

            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(stopLon, stopLat), //Long Lat
                label: {
                    id: element.pt3ISO,
                    text: element.ptTitle + "\n $" + tradeValue,
                    fillColor: Cesium.Color.WHITE,
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                    showBackground: true
                }
            });

            // This is where it becomes a smooth path.
            arcEntity.position.setInterpolationOptions({
                interpolationDegree: 5,
                interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
            });
        });
    }

    return {

        plotPoints: plotPoints,

        createPath:createPath

    };
})();