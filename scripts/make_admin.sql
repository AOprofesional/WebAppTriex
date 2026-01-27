-- SQL para hacer admin a triexwebapp@gmail.com
-- Ejecutar DESPUÉS de registrar el usuario en la app

UPDATE profiles 
SET role = 'admin',
    full_name = 'Administrador Triex'
WHERE email = 'triexwebapp@gmail.com';

-- Verificar el cambio
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'triexwebapp@gmail.com';
