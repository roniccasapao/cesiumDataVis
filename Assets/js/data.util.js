var dataUtil = (function () {
    var countryInfo = getCountryInfo();

    function sortByTradeValue(countryList) {
        var temp;
        for (x = 0; x < countryList.length; x++) {
            for (y = 1; y <= x; y++) {
                if (
                    // (countryList[y - 1].pt3ISO == "WLD" || countryList[y - 1].pt3ISO == null)||
                    countryList[y - 1].pt3ISO == "WLD" ||
                    (countryList[y - 1].TradeValue < countryList[y].TradeValue)) {
                    temp = countryList[y];
                    countryList[y] = countryList[y - 1];
                    countryList[y - 1] = temp;
                }
            }
        }

        if (countryList.length > 6) {
            countryList = countryList.slice(0, 5);
        }
        return countryList;
    }

    function sortCommodities(data) {
        var temp
        var commodityList = [];
        Object.keys(data).map(function (key) {
            for (x = 0; x < data[key].trades.length; x++) {
                if (commodityList[data[key].trades[x].cmdCode]) {
                    commodityList[data[key].trades[x].cmdCode] = {
                        "cmdCode": data[key].trades[x].cmdCode,
                        "cmdDescE": data[key].trades[x].cmdDescE,
                        "TradeValue": data[key].trades[x].TradeValue + data[key].TradeValue
                    }
                } else {
                    commodityList[data[key].trades[x].cmdCode] = {
                        "cmdCode": data[key].trades[x].cmdCode,
                        "cmdDescE": data[key].trades[x].cmdDescE,
                        "TradeValue": data[key].TradeValue
                    }
                }
            }
        });

        var commodities = Object.keys(commodityList).map(function (key) {
            return {
                cmdCode: commodityList[key].cmdCode,
                cmdDescE: commodityList[key].cmdDescE,
                TradeValue: commodityList[key].TradeValue,
            };
        });

        var temp;
        for (x = 0; x < commodities.length; x++) {
            for (y = 1; y <= x; y++) {
                if (commodities[y - 1].TradeValue < commodities[y].TradeValue) {
                    temp = commodities[y];
                    commodities[y] = commodities[y - 1];
                    commodities[y - 1] = temp;
                }
            }
        }

        if (commodities.length > 6) {
            commodities = commodities.slice(0, 5);
        }

        return commodities;
    }


    function sortByGrossWeight(data) {
        var temp;
        for (x = 0; x < data.length; x++) {
            for (y = 1; y <= x; y++) {
                if (
                    // (data[y - 1].pt3ISO == "WLD" || data[y - 1].pt3ISO == null)||
                    data[y - 1].pt3ISO == "WLD" ||
                    (data[y - 1].GrossWeight < data[y].GrossWeight)) {
                    temp = data[y];
                    data[y] = data[y - 1];
                    data[y - 1] = temp;
                }
            }
        }
        if (data.length > 6) {
            data = data.slice(0, 5);
        }
        return data;
    }

    function getTradeInformation(numericCountryCode, year) {
        var latitude, longitude;
        var tradeData = getTradeData(numericCountryCode, year);

        var partnerCountriesList = Object.keys(tradeData).map(function (key) {
            return {
                rgDesc: tradeData[key].rgDesc,
                rtCode: tradeData[key].rtCode,
                rtTitle: tradeData[key].rtTitle,
                rt3ISO: tradeData[key].rt3ISO,
                ptCode: tradeData[key].ptCode,
                ptTitle: tradeData[key].ptTitle,
                pt3ISO: tradeData[key].pt3ISO,
                qtCode: tradeData[key].qtCode,
                qtDesc: tradeData[key].qtDesc,
                GrossWeight: tradeData[key].GrossWeight,
                TradeValue: tradeData[key].TradeValue,
                trades: tradeData[key].trades
            };
        });

        var pLatitude,
            pLongitude,
            rLatitude,
            rLongitude;

        partnerCountriesList.forEach(function (element) {
            pLatitude = getCountryLat(element.pt3ISO);
            pLongitude = getCountryLng(element.pt3ISO);

            rLatitude = getCountryLat(element.rt3ISO);
            rLongitude = getCountryLng(element.rt3ISO);

            element.partnerCoordinates = [pLatitude, pLongitude];
            element.reporterCoordinates = [rLatitude, rLongitude];
        });

        return partnerCountriesList;
    }

    function getCountryLat(isoCode) {
        if (countryInfo[isoCode]) {
            return countryInfo[isoCode].latlng[0];
        } else {
            return null;
        }
    }

    function getCountryLng(isoCode) {
        if (countryInfo[isoCode]) {
            return countryInfo[isoCode].latlng[1];
        } else {
            return null;
        }
    }

    function getCountryInfo() {
        var _url = "http://restcountries.eu/rest/v2/all?fields=name;alpha3Code;numericCode;latlng";
        var parsedArray = new Map();

        $.ajax({
            type: "GET",
            url: _url,
            async: false,
            success: function (result) {
                $.map(result, function (data) {
                    parsedArray[data.alpha3Code] = {
                        "name": data.name,
                        "alpha3Code": data.alpha3Code,
                        "numericCode": data.numericCode,
                        "latlng": data.latlng
                    }
                });
            }
        })
        return parsedArray;
    }

    /*
    r, px, ps, p, rg, cc, max, type, freq
    
    r  : reporting area (default = 0)
    freq  : data set frequency (default = A)[Valid values: A(Annual),M (Monthly)]
    ps :time period [YYYY or YYYYMM or now or recent]
    px : classification [HS,H0,H1,H2,H3,H4,ST,S1,S2,S3,S4,BEC,EB02]
    p : partner area (default = all)
    rg : trade regime / trade flow (default = all) [1-Import,2-Export,3-reImport,4-reExport]
    cc : classification code (default = AG2) [TOTAL ,AG1, AG2, AG3, AG4, AG5, AG6,ALL ]
    type : trade data type (default = C) [C-Commodities,S-Services]
    */

    function isEmpty(value) {
        return value == null || value == "";
    }

    function getTradeData(numericCountryCode, year) {
        var _mock = "./assets/data/mockResponse.json"
        // var _url = "https://comtrade.un.org/api/get?r=" + numericCountryCode + "&px=hs&ps=" + year; //FIX FORMAT THIS
        var parsedArray = new Map();

        var params = {
            "r": numericCountryCode,
            "ps": year
        };

        for (key in params)
            if (isEmpty(params[key]))
                delete params[key];

        var str = jQuery.param(params);
        var _url2 = "https://comtrade.un.org/api/get?px=hs&";
        _url2 += str;


        // var _url = "https://comtrade.un.org/api/get?r=608&px=h0&ps=2010&type=C&freq=A";

        $.ajax({
            type: "GET",
            url: _url2,
            async: false
        })
            .done(function (result) {
                parsedArray = parseTradeData(result);


                $(".loading").css("display", "none");
            })
            .fail(function () {
                alert("error");
                $(".loading").css("display", "none");
            })
            .always(function () {

            });
        return parsedArray;
    }

    function parseTradeData(result) {
        var parsedArray = [];

        $.map(result.dataset, function (data) {
            if (parsedArray[data.pt3ISO]) {
                parsedArray[data.pt3ISO].trades.push({
                    "yr": data.yr,
                    "period": data.period,
                    "rgCode": data.rgCode,
                    "rgDesc": data.rgDesc,
                    "ptTitle": data.ptTitle,
                    "pt3ISO": data.pt3ISO,
                    "cmdCode": data.cmdCode,
                    "cmdDescE": data.cmdDescE,
                    "NetWeight": data.NetWeight,
                    "GrossWeight": data.GrossWeight,
                    "TradeValue": data.TradeValue
                })
                parsedArray[data.pt3ISO].GrossWeight += data.GrossWeight;
                parsedArray[data.pt3ISO].TradeValue += data.TradeValue;
            } else {
                parsedArray[data.pt3ISO] = {
                    "rgDesc": data.rgDesc,
                    "rtCode": data.rtCode,
                    "rtTitle": data.rtTitle,
                    "rt3ISO": data.rt3ISO,
                    "ptCode": data.ptCode,
                    "ptTitle": data.ptTitle,
                    "pt3ISO": data.pt3ISO,
                    "qtCode": data.qtCode,
                    "qtDesc": data.qtDesc,
                    "GrossWeight": data.GrossWeight,
                    "TradeValue": data.TradeValue,
                    "trades": [{
                        "yr": data.yr,
                        "period": data.period,
                        "rgCode": data.rgCode,
                        "rgDesc": data.rgDesc,
                        "ptTitle": data.ptTitle,
                        "pt3ISO": data.pt3ISO,
                        "cmdCode": data.cmdCode,
                        "cmdDescE": data.cmdDescE,
                        "NetWeight": data.NetWeight,
                        "GrossWeight": data.GrossWeight,
                        "TradeValue": data.TradeValue
                    }]
                }
            }
        });
        return parsedArray;
    }

    return {
        getCountryInfo: getCountryInfo,

        getTradeInfo: getTradeInformation,

        sortByTradeValue: sortByTradeValue,

        sortByGrossWeight: sortByGrossWeight,

        sortCommodities: sortCommodities

    };
})();