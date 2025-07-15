require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');
const bcrypt = require('bcrypt');


// Middleware para verificar usuario y contraseña
const authenticateUser = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  try {
    // Buscar usuario en Supabase
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar JWT manualmente (alternativa: usar Supabase Auth)
    const token = jwt.sign(
      { username: user.username, rol: user.rol },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Adjuntar token y usuario al request
    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error en autenticación' });
  }
};

module.exports = authenticateUser;