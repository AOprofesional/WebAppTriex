-- Create sales_team table
CREATE TABLE IF NOT EXISTS sales_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT,
    phone TEXT,
    email TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_team ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can view sales team"
    ON sales_team FOR SELECT
    USING (true);

-- Only authenticated admins can modify
CREATE POLICY "Admins can manage sales team"
    ON sales_team FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sales_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_team_updated_at
    BEFORE UPDATE ON sales_team
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_team_updated_at();

-- Insert initial data
INSERT INTO sales_team (name, role, image_url, phone, order_index) VALUES
('Agostina Melica', 'Administración', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/AGOSTINA%20MELICA%20ADMINISTRACION.jpg', '5492612455808', 1),
('Benjamín Arrojo', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/BENJAMIN%20ARROJO%20VENTAS.jpg', NULL, 2),
('Celeste Garro', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/CELESTE%20GARRO%20VENTAS.jpg', NULL, 3),
('Eliana Rivero', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/ELIANA%20RIVERO%20VENTAS.jpg', '5492612469416', 4),
('Florencia Benavides', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/FLORENCIA%20BENAVIDES%20VENTAS.jpg', '5492613378514', 5),
('Hugo Fisigaro', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/HUGO%20FISIGARO%20VENTAS.jpg', '5492613343492', 6),
('Nicolás Cozzani', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/NICOLAS%20COZZANI%20VENTAS.jpg', '5492613460978', 7),
('Victoria Amaya', 'Ventas', 'https://fivpohqoxrpxjicdwnzf.supabase.co/storage/v1/object/public/triex-public/Equipo/VICTORIA%20AMAYA%20VENTAS.jpg', '5492616569000', 8);
