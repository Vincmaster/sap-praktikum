sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'tasklist/test/integration/FirstJourney',
		'tasklist/test/integration/pages/WorkersList',
		'tasklist/test/integration/pages/WorkersObjectPage'
    ],
    function(JourneyRunner, opaJourney, WorkersList, WorkersObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('tasklist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheWorkersList: WorkersList,
					onTheWorkersObjectPage: WorkersObjectPage
                }
            },
            opaJourney.run
        );
    }
);