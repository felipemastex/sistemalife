/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Adicionado para corrigir o erro 'require.extensions is not supported by webpack'
    // que vem da dependência 'handlebars' no genkit.
    // Isto diz ao webpack para não empacotar o 'handlebars' no lado do servidor.
    if (isServer) {
      config.externals = [...config.externals, 'handlebars'];
    }

    return config;
  },
};

export default nextConfig;
