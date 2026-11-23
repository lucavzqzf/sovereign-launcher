/* Sovereign : année du pied de page. Le lien de téléchargement est directement dans index.html
   (dernière version du launcher publiée sur GitHub : sovereign-launcher > Releases). */
document.querySelectorAll('.year,#year').forEach(n => n.textContent = new Date().getFullYear());
