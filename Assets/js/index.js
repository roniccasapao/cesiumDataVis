$(document).ready(function () {
    google.charts.load('current', { packages: ['corechart'] });
    mapComponent.generateMap();
    $(".sidebar-overlay").css("display", "block");
    $(".loading").css("display", "none");

});

$('#sideNav').slideReveal({
    width: 350,
    push: false,
    trigger: $(".sideNavtrigger")

});

var mapComponent = (function () {
    var viewer;
    function generateMap() {

        var imageryViewModels = [];
        imageryViewModels = mapCreateUtil.getImageryModels();

        viewer = new Cesium.Viewer('cesiumContainer', {
            animation: false,
            baseLayerPicker: false,
            imageryProvider: false,
            timeline: false
        });

        var layers = viewer.imageryLayers;
        var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {
            globe: viewer.scene.globe,
            imageryProviderViewModels: mapCreateUtil.getImageryModels()
        });

        createRCountryDropdown();
        createYearDropdown();
    }

    $('#rcountryDropdown').on('change', function () {
        $(".noDataMessage").css("display", "none");
        $(".loading").css("display", "block");
        viewer.entities.removeAll();
        $('#yearDropdown option:eq(1)').attr('selected', 'selected');
        $('#yearDropdown').removeAttr('disabled');
        setTimeout(displayInformation(), 10000);
        // displayInformation();
    });

    $('#yearDropdown').on('change', function () {
        $(".noDataMessage").css("display", "none");
        $(".loading").css("display", "block");
        viewer.entities.removeAll();
        //  $('#yearDropdown option:eq(1)').attr('selected', 'selected');
        displayInformation();
    });

    function displayInformation() {
        var numericCountryCode = $("#rcountryDropdown").find(':selected').val();
        var year = $("#yearDropdown").find(':selected').val();

        var tradeInfo = dataUtil.getTradeInfo(numericCountryCode, year);

        if (tradeInfo.length > 0) {
            var sortedInfo = dataUtil.sortByTradeValue(tradeInfo);

            $("#overlay-tabs").css("display", "block");

            mapDataUtil.plotPoints(viewer, sortedInfo);
            mapDataUtil.createPath(viewer, sortedInfo);
            createTopTradeTable(sortedInfo);
            createCommodityTable(tradeInfo);
        } else {
            $(".noDataMessage").css("display", "block");
        }
    }

    function createRCountryDropdown() {
        var countryInfo = dataUtil.getCountryInfo();
        var countryList = [];

        $.each(countryInfo, function (k, v) {
            countryList.push({
                "id": v.numericCode,
                "name": v.name
            });
        });
        helpers.buildDropdown(countryList, $("#rcountryDropdown"), "Select country")
    }

    function createYearDropdown() {
        var yearList = [];
        var year = 2016;

        for (var i = 0; i <= 16; i++) {
            yearList.push({
                "id": year,
                "name": year
            })
            year--;
        }
        helpers.buildDropdown(yearList, $("#yearDropdown"), "Select year");
    }

    function createTopTradeTable(sortedInfo) {
        var dataArray = [['Country', 'Trade Value']];

        sortedInfo.forEach(function (element) {
            dataArray.push([element.ptTitle, element.TradeValue]);
        });

        var data = google.visualization.arrayToDataTable(dataArray);

        var view = new google.visualization.DataView(data);
        view.setColumns([0, 1,
            {
                calc: "stringify",
                sourceColumn: 1,
                type: "string",
                role: "annotation"
            }]);

        var options = {
            title: "Top 5 Countries in Trade Value",
            titleTextStyle: {
                color: '#fff'
            },
            width: 350,
            height: 200,
            colors: ['#ff6a00'],
            hAxis: {
                textStyle: { color: '#FFF' },
                format: 'short'
            },
            vAxis: {
                textStyle: { color: '#FFF' }
            },
            bar: { groupWidth: "90%" },
            legend: { position: "none" },
            backgroundColor: { fill: 'transparent' }
        };
        var chart = new google.visualization.BarChart(document.getElementById("topTrades"));
        chart.draw(view, options);
    }

    function createCommodityTable(tradeInfo) {
        var commodities = dataUtil.sortCommodities(tradeInfo);

        var dataArray = [['Commodity', 'Trade Value']];

        commodities.forEach(function (element) {
            dataArray.push([element.cmdDescE, element.TradeValue]);
        });

        var data = google.visualization.arrayToDataTable(dataArray);

        var view = new google.visualization.DataView(data);
        // view.setColumns([0, 1,
        //     {
        //         calc: "stringify",
        //         sourceColumn: 1,
        //         type: "string",
        //         role: "annotation"
        //     }]);

        var options = {
            title: "Top 5 Commodities according to  Trade Value",
            titleTextStyle: {
                color: '#fff'
            },
            width: 350,
            height: 200,
            colors: ['#ff6a00'],
            vAxis: {
                textStyle: { color: '#fff' },
                format: 'short'
            },
            hAxis: { textPosition: 'none' },
            bar: { groupWidth: "95%" },
            legend: { position: "none" },
            backgroundColor: { fill: 'transparent' }
        };

        var chart = new google.visualization.ColumnChart(document.getElementById("topCommodities"));

        chart.draw(view, options);
    }

    return {

        generateMap: generateMap,

        displayInformation: displayInformation

    };
})();

