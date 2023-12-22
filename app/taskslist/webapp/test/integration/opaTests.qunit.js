sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'taskslist/test/integration/FirstJourney',
		'taskslist/test/integration/pages/RedistributionTasksList',
		'taskslist/test/integration/pages/RedistributionTasksObjectPage'
    ],
    function(JourneyRunner, opaJourney, RedistributionTasksList, RedistributionTasksObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('taskslist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRedistributionTasksList: RedistributionTasksList,
					onTheRedistributionTasksObjectPage: RedistributionTasksObjectPage
                }
            },
            opaJourney.run
        );
    }
);