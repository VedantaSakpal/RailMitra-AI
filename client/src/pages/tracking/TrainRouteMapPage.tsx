import { useState, useEffect } from 'react';
import { getLines, RailwayLine } from '../../lib/services/railway';
import { Map } from 'lucide-react';

export default function TrainRouteMapPage() {
  const [lines, setLines] = useState<RailwayLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLines().then(data => {
      setLines(data);
      setLoading(false);
    });
  }, []);

  // Organize lines logically for display
  const displayLines = [];

  if (lines.length > 0) {
    // 1. Western Line
    const western = lines.find(l => l.type === 'WESTERN');
    if (western) {
      displayLines.push({
        id: western.id,
        name: 'Western Line',
        color: western.color || '#16a34a',
        sections: [
          { name: 'Churchgate to Dahanu Road', stations: western.stations || [] }
        ]
      });
    }

    // 2. Central Line (Split into Main, Kasara, Khopoli)
    const central = lines.find(l => l.type === 'CENTRAL');
    if (central && central.stations) {
      // Seq 1-26 is Main up to Kalyan
      const mainStns = central.stations.filter(s => s.sequence <= 26);
      
      // Kasara branch: Shahad (27) to Kasara (37)
      const kasaraCodes = ['SHAD', 'ABY', 'TLA', 'KDV', 'VSD', 'ASO', 'ATH', 'THS', 'KHPI', 'UM', 'KSRA'];
      const kasaraStns = central.stations.filter(s => s.sequence > 26 && kasaraCodes.includes(s.code));
      
      // Khopoli branch: Vithalwadi (27) to Khopoli (40)
      const khopoliCodes = ['VLDI', 'ULNR', 'ABH', 'BUD', 'VGI', 'SHLU', 'NRL', 'BVS', 'KJT', 'PDI', 'KLY', 'DL', 'LWJ', 'KHPO'];
      const khopoliStns = central.stations.filter(s => s.sequence > 26 && khopoliCodes.includes(s.code));

      displayLines.push({
        id: central.id,
        name: 'Central Line',
        color: central.color || '#dc2626',
        sections: [
          { name: 'CSMT to Kalyan', stations: mainStns },
          { name: 'Kalyan to Kasara', stations: kasaraStns },
          { name: 'Kalyan to Khopoli', stations: khopoliStns }
        ]
      });
    }

    // 3. Harbour Line (Split into Main/Goregaon and Trans-Harbour)
    const harbour = lines.find(l => l.type === 'HARBOUR');
    if (harbour && harbour.stations) {
      // Trans-Harbour has codes ending in -TH or specific codes like DIGH, AIRL, etc.
      const transHarbourCodes = ['TNA-TH', 'DIGH', 'AIRL', 'RABE', 'GNSL', 'KPHN', 'TURB', 'SNCR-TH', 'VSH-TH', 'JNJ-TH', 'NEU-TH', 'SWDV-TH', 'BEPR-TH', 'KHAG-TH', 'MANR-TH', 'KNDS-TH', 'PNVL-TH'];
      
      const transHarbourStns = harbour.stations.filter(s => transHarbourCodes.includes(s.code));
      
      // Harbour Goregaon branch
      const goregaonCodes = ['KCE', 'MM-H', 'BA-H', 'KHAR-H', 'STC-H', 'VLP-H', 'ADH-H', 'JOS-H', 'RMAR-H', 'GMN-H'];
      const goregaonStns = harbour.stations.filter(s => goregaonCodes.includes(s.code));

      // Harbour Main
      const mainHarbourStns = harbour.stations.filter(s => !transHarbourCodes.includes(s.code) && !goregaonCodes.includes(s.code));

      displayLines.push({
        id: harbour.id + '_harbour',
        name: 'Harbour Line',
        color: harbour.color || '#ca8a04',
        sections: [
          { name: 'CSMT to Panvel', stations: mainHarbourStns },
          { name: 'Wadala Road to Goregaon', stations: goregaonStns }
        ]
      });

      displayLines.push({
        id: harbour.id + '_trans',
        name: 'Trans-Harbour Line',
        color: '#9333ea', // Purple for Trans-Harbour
        sections: [
          { name: 'Thane to Panvel', stations: transHarbourStns }
        ]
      });
    }
  }

  return (
    <div className="space-y-6 page-enter pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Map className="w-8 h-8 text-primary" />
          Train Route Map
        </h1>
        <p className="text-muted-foreground mt-1">View the stations across different suburban railway lines.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayLines.map(line => (
            <div key={line.id} className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: line.color }}
                />
                <h2 className="font-bold text-xl">{line.name}</h2>
              </div>
              
              <div className="space-y-8">
                {line.sections.map((section, idx) => (
                  <div key={idx} className="space-y-4">
                    {line.sections.length > 1 && (
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{section.name}</h3>
                    )}
                    <div className="relative border-l-2 ml-2 space-y-4 py-2" style={{ borderColor: line.color }}>
                      {section.stations.sort((a: any, b: any) => a.sequence - b.sequence).map((station: any) => (
                        <div key={station.id} className="relative flex items-center">
                          <div 
                            className="absolute -left-[25px] w-3 h-3 rounded-full border-2 bg-background"
                            style={{ borderColor: line.color }}
                          />
                          <div className="pl-4">
                            <p className="font-semibold text-sm">{station.name.replace(/ \(.+\)/, '')}</p>
                            <p className="text-xs text-muted-foreground font-mono">{station.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
