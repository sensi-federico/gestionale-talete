// NuovoInterventoImpresaPage.tsx
// Pagina per imprese per inserire un nuovo intervento

import InterventoWizard from "../wizard/InterventoWizard";

const NuovoInterventoImpresaPage = () => {
  return (
    <div className="standalone-page">
      <InterventoWizard isImpresa={true} />
    </div>
  );
};

export default NuovoInterventoImpresaPage;
