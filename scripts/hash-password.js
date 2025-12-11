import bcrypt from 'bcrypt'

const password = 'VotreMotDePasseIci' // Changez ceci
const saltRounds = 10

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Erreur:', err)
    return
  }
  
  console.log('\n✅ Mot de passe haché généré :')
  console.log('\nMot de passe clair :', password)
  console.log('Hash bcrypt :', hash)
  console.log('\n📋 Requête SQL à exécuter :')
  console.log(`
UPDATE utilisateurs 
SET mot_de_passe = '${hash}'
WHERE email = 'van.abaghe660@outlook.com';
  `)
  console.log('\n')
})






