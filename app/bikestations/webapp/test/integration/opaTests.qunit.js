sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bikestations/test/integration/FirstJourney',
		'bikestations/test/integration/pages/StationsList',
		'bikestations/test/integration/pages/StationsObjectPage'
    ],
    function(JourneyRunner, opaJourney, StationsList, StationsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bikestations') + '/index.html'
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