sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'stations/test/integration/FirstJourney',
		'stations/test/integration/pages/StationsList',
		'stations/test/integration/pages/StationsObjectPage'
    ],
    function(JourneyRunner, opaJourney, StationsList, StationsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('stations') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheStationsList: StationsList,
					onTheStationsObjectPage: StationsObjectPage
                }
            },
            opaJourney.run
        );
    }
);