# Idee Redistribution Logik

## Basic Version (mit simpler Threshold, ohne Distanz/Geodaten zu berücksichtigen)

### Vorgehen:
1. Event (bike rented) kommt von Event Mesh in CAP App an.
2. Checke Anzahl bikes_available von der Station, von der das Bike gerade ausgeliehen wurde.
3. Wenn kleiner als 5 (oder beliebige andere Threshold), dann selecte aus DB die Anzahl bikes_available von allen anderen Stationen.
4. Wähle die Station mit höchster Anzahl bikes_available.
5. Verschiebe 3 (oder beliebige andere Anzahl) Bikes von dieser Station zu der, wo gerade das Bike ausgeliehen wurde.
   - 5.1 dazu einen Redistribution_Task erstellen mit Status "Pending" und beliebigen Worker
   - 5.2 dann 3 Task Items erstellen (1 pro zu verschiebendes Bike)
6. Worker klickt dann nach einiger Zeit in der Workers App auf "Auftrag erledigt".
7. Sobald dieses Event eintritt:
   - 7.1: Lösche die 3 Bikes aus der departure Station.
   - 7.2: Schreibe die 3 Bikes in die target Station.
   - 7.3: Setze den Status des Redistribution_Taks auf closed.
8. FERTIG

## Advanced Version

### Ideen:
- Prozentuale Kapazitäten statt harte Thresholds oder Kombination aus beiden
- Thresholds individuell pro Station (abhängig von % UND absoluter Anzahl)
- Redistribution zusätzlich abhängig von Geodaten (geringste Entfernung)
- Bikes von mehr als 1 Station verschieben, z.B. wenn eine Station X 10 Bikes braucht, dann 5 von Station B und 5 von Station C verschieben



