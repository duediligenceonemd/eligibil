const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [lang, setLangState] = useStateApp('EN');
  const setLang = (l) => {
    setLangState(l);
    if (window.setLanguage) window.setLanguage(l);
  };
  const [showReport, setShowReport] = useStateApp(window.__TWEAKS?.showReport ?? true);

  useEffectApp(() => {
    if (window.setLanguage) window.setLanguage('EN');
    const onT = (e) => setShowReport(!!e.detail.showReport);
    const onLang = (e) => setLangState(e.detail.lang);
    window.addEventListener('tweaks-change', onT);
    window.addEventListener('languagechange', onLang);
    return () => {
      window.removeEventListener('tweaks-change', onT);
      window.removeEventListener('languagechange', onLang);
    };
  }, []);

  return (
    <>
      <NavOrg lang={lang} setLang={setLang} />
      <HeroOrg lang={lang} />
      <Deadlines />
      <UploadFlow />
      {showReport && <SampleReportOrg />}
      <ProductsOrg />
      <DocGenOrg />
      <ProgramsOrg />
      <VerticalsGrid />
      <AboutOrg />
      <VerifiedPartners />
      <ResourcesOrg />
      <ReportsOrg />
      <DataQualityOrg />
      <FAQOrg />
      <FinalCTAOrg />
      <FooterOrg lang={lang} setLang={setLang} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
