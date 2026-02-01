// NuovoRilevamentoPage.tsx
// Pagina per tecnici per inserire un nuovo intervento

import InterventoWizard from "../wizard/InterventoWizard";

const NuovoRilevamentoPage = () => {
  return (
    <div className="standalone-page">
      <InterventoWizard isImpresa={false} />
    </div>
  );
};

export default NuovoRilevamentoPage;
