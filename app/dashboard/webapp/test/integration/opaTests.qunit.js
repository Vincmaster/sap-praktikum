sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'dashboard/test/integration/FirstJourney',
		'dashboard/test/integration/pages/RedistributionTaskList',
		'dashboard/test/integration/pages/RedistributionTaskObjectPage'
    ],
    function(JourneyRunner, opaJourney, RedistributionTaskList, RedistributionTaskObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('dashboard') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRedistributionTaskList: RedistributionTaskList,
					onTheRedistributionTaskObjectPage: RedistributionTaskObjectPage
                }
            },
            opaJourney.run
        );
    }
);