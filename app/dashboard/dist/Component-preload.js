//@ui5-bundle dashboard/Component-preload.js
jQuery.sap.registerPreloadedModules({
"version":"2.0",
"modules":{
	"dashboard/Component.js":function(){sap.ui.define(["sap/fe/core/AppComponent"],function(e){"use strict";return e.extend("dashboard.Component",{metadata:{manifest:"json"}})});
},
	"dashboard/i18n/i18n.properties":'# This is the resource bundle for dashboard\n\n#Texts for manifest.json\n\n#XTIT: Application name\nappTitle=Dashboard\n\n#YDES: Application description\nappDescription=A Fiori application.\n\nflpTitle=Dashboard\n\nflpSubtitle=iBike Dashboard\n',
	"dashboard/manifest.json":'{"_version":"1.59.0","sap.app":{"id":"dashboard","type":"application","i18n":"i18n/i18n.properties","applicationVersion":{"version":"0.0.1"},"title":"{{appTitle}}","description":"{{appDescription}}","resources":"resources.json","sourceTemplate":{"id":"@sap/generator-fiori:alp","version":"1.12.1","toolsId":"9920a7dd-2eec-4b1f-88eb-e968080e59c5"},"dataSources":{"mainService":{"uri":"odata/v4/dashboard/","type":"OData","settings":{"annotations":[],"localUri":"localService/metadata.xml","odataVersion":"4.0"}}},"crossNavigation":{"inbounds":{"Dashboard-View":{"semanticObject":"Dashboard","action":"View","title":"{{flpTitle}}","subTitle":"{{flpSubtitle}}","signature":{"parameters":{},"additionalParameters":"allowed"}}}}},"sap.ui":{"technology":"UI5","icons":{"icon":"","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true}},"sap.ui5":{"flexEnabled":true,"dependencies":{"minUI5Version":"1.120.4","libs":{"sap.m":{},"sap.ui.core":{},"sap.ushell":{},"sap.fe.templates":{}}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"dashboard.i18n.i18n"}},"":{"dataSource":"mainService","preload":true,"settings":{"synchronizationMode":"None","operationMode":"Server","autoExpandSelect":true,"earlyRequests":true}},"@i18n":{"type":"sap.ui.model.resource.ResourceModel","uri":"i18n/i18n.properties"}},"resources":{"css":[]},"routing":{"config":{},"routes":[{"pattern":":?query:","name":"RedistributionTaskList","target":"RedistributionTaskList"},{"pattern":"RedistributionTask({key}):?query:","name":"RedistributionTaskObjectPage","target":"RedistributionTaskObjectPage"}],"targets":{"RedistributionTaskList":{"type":"Component","id":"RedistributionTaskList","name":"sap.fe.templates.ListReport","options":{"settings":{"contextPath":"/RedistributionTask","variantManagement":"Page","navigation":{"RedistributionTask":{"detail":{"route":"RedistributionTaskObjectPage"}}},"controlConfiguration":{"@com.sap.vocabularies.UI.v1.LineItem":{"tableSettings":{"type":"AnalyticalTable","selectionMode":"Auto"}}},"views":{"paths":[{"primary":[{"annotationPath":"com.sap.vocabularies.UI.v1.PresentationVariant"}],"secondary":[{"annotationPath":"com.sap.vocabularies.UI.v1.LineItem"}],"defaultPath":"both"}]}}}},"RedistributionTaskObjectPage":{"type":"Component","id":"RedistributionTaskObjectPage","name":"sap.fe.templates.ObjectPage","options":{"settings":{"editableHeaderContent":false,"contextPath":"/RedistributionTask"}}}}}},"sap.fiori":{"registrationIds":[],"archeType":"analytical"},"sap.cloud":{"public":true,"service":"ibike"}}'
}});
