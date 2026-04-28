// v2 FAQ extensions (appended to existing FAQs for v2 page)
const FAQS_V2_EXTRA = [
  { q: 'Cum încarc artefactele? Ce formate sunt acceptate?',
    a: 'Pitch Deck: PDF sau PPTX, până la 50 MB. Video Pitch: MP4, MOV sau WebM, maximum 3 minute, până la 500 MB. Whitepaper: PDF sau DOCX, maximum 10 pagini, până la 30 MB. Upload-ul este securizat (HTTPS + criptare la rest). Datele tale nu sunt partajate cu terți.' },
  { q: 'Chiar este nevoie de toate trei artefactele?',
    a: 'Nu. Minimum 1 artefact e suficient pentru a începe. Cu cât încarci mai multe, cu atât mai precis profilul și mai mare Confidence Score-ul. Sistemul îți arată explicit ce câștigi dacă adaugi fiecare artefact nou.' },
  { q: 'Cum calculează sistemul TRL-ul automat?',
    a: 'AI-ul analizează semnalele din whitepaper și pitch deck — descrierea tehnică, nivelul de validare menționat (POC, prototip, pilot, producție), dovezile existente (users, revenue, publicații), maturitatea arhitecturii. Rezultatul e o estimare obiectivă cu un interval de încredere. Dacă TRL-ul estimat e diferit de percepția ta, poți vedea exact pe ce semnale se bazează sistemul.' },
  { q: 'Ce se întâmplă dacă n-am niciun document (sunt la faza de idee)?',
    a: 'Completezi formularul minim — sector, stadiu, geografie, compoziție echipă, sumă țintă, problema pe care o rezolvi. 30 de secunde. Primești un scor de bază cu Confidence Score mai mic și, mai important, un plan clar ce artefacte să construiești primul pentru a deveni aplicabil la granturi reale.' },
  { q: 'Planul de îmbunătățire — cât de concret e?',
    a: 'Foarte concret. Nu primești "îmbunătățește pitch deck-ul". Primești: "Adaugă un slide de competitori cu 3 jucători direcți și 2 indirecți, evidențiind diferențiatorii tăi tehnologici — impact estimat +8 puncte Match Score pentru EIC". Fiecare acțiune are un impact numeric estimat și o prioritate.' },
  { q: 'Cât de des se reactualizează scorul?',
    a: 'Re-scoring automat la fiecare acțiune finalizată. Încarci o versiune nouă a pitch-ului → scoruri recalculate în secunde. Adaugi un partener în ResearchMatch → Readiness Score pentru programele cu cerință de consorțiu sare instant. Apare un program nou potrivit → ești notificat.' },
  { q: 'Scorurile voastre prezic rata de aprobare?',
    a: 'Nu garantăm rezultate — decizia aparține evaluatorilor. Însă scorurile noastre sunt corelate statistic cu eligibilitatea și competitivitatea aplicațiilor, bazate pe criteriile oficiale publicate de fiecare finanțator. Un Match >80 + Readiness >70 înseamnă că aplicația ta are toate elementele cerute — dar calitatea execuției rămâne în responsabilitatea ta.' },
];
window.FAQS_V2_EXTRA = FAQS_V2_EXTRA;
