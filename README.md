# SlovakiaRaftingGIS
School project with GIS.
Shows all rivers with camps near and can display some barriers on river where u can't raft.

##What you need?
* register on mapbox for your credentials and put them to views/map.jade
* create DB with this free dataset http://download.freemap.sk/slovakia.osm/slovakia.osm.pbf
* at routes/index.js you need include your path to PostgreSQL

##How it works?
* run app with `npm start`
* go to `localhost:3000`

Now you can click on map and the nearest river will show up, like on screens. If you want know camp sites or barriers on river click on checkbox. For camps there is 200m distance to look around, or change it in 'Max camping distance'.
If you know name of the river type it in 'River', set checkboxes or distance if you want and hit 'Find Route'

##Screens
![GitHub Logo](https://github.com/robooo/SlovakiaRaftingGIS/blob/master/screens/logo_slovakia_1.png)
![GitHub Logo](https://github.com/robooo/SlovakiaRaftingGIS/blob/master/screens/logo_slovakia_2.png)
