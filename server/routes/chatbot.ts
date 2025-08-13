import { RequestHandler } from "express";

interface ChatbotQuery {
  message: string;
}

interface ChatbotResponse {
  response: string;
  links?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

const searchDatabase = {
  'kemiskinan': {
    response: 'Berikut informasi mengenai kemiskinan di Kota Medan:',
    links: [
      {
        title: 'Data Kemiskinan Kota Medan 2023',
        url: 'https://medankota.bps.go.id/statistics-table/subject-563',
        description: 'Statistik kemiskinan di Kota Medan tahun 2023'
      },
      {
        title: 'Profil Kemiskinan Sumatera Utara',
        url: 'https://medankota.bps.go.id/statistics/poverty-profile',
        description: 'Profil kemiskinan Provinsi Sumatera Utara'
      }
    ]
  },
  'penduduk': {
    response: 'Berikut informasi mengenai kependudukan di Kota Medan:',
    links: [
      {
        title: 'Data Kependudukan Kota Medan 2023',
        url: 'https://medankota.bps.go.id/statistics-table/subject-12',
        description: 'Statistik kependudukan dan demografi Kota Medan'
      },
      {
        title: 'Proyeksi Penduduk Kota Medan',
        url: 'https://medankota.bps.go.id/statistics/population-projection',
        description: 'Proyeksi jumlah penduduk Kota Medan 2020-2035'
      }
    ]
  },
  'ekonomi': {
    response: 'Berikut informasi mengenai ekonomi di Kota Medan:',
    links: [
      {
        title: 'PDRB Kota Medan 2023',
        url: 'https://medankota.bps.go.id/statistics-table/subject-52',
        description: 'Produk Domestik Regional Bruto Kota Medan'
      },
      {
        title: 'Inflasi Kota Medan',
        url: 'https://medankota.bps.go.id/statistics/inflation',
        description: 'Data inflasi dan indeks harga konsumen Kota Medan'
      }
    ]
  },
  'industri': {
    response: 'Berikut informasi mengenai industri di Kota Medan:',
    links: [
      {
        title: 'Statistik Industri Kota Medan',
        url: 'https://medankota.bps.go.id/statistics-table/subject-15',
        description: 'Data statistik industri manufaktur dan besar Kota Medan'
      }
    ]
  },
  'pendidikan': {
    response: 'Berikut informasi mengenai pendidikan di Kota Medan:',
    links: [
      {
        title: 'Statistik Pendidikan Kota Medan',
        url: 'https://medankota.bps.go.id/statistics-table/subject-28',
        description: 'Data statistik pendidikan di Kota Medan'
      }
    ]
  },
  'kesehatan': {
    response: 'Berikut informasi mengenai kesehatan di Kota Medan:',
    links: [
      {
        title: 'Statistik Kesehatan Kota Medan',
        url: 'https://medankota.bps.go.id/statistics-table/subject-30',
        description: 'Data statistik kesehatan dan fasilitas kesehatan Kota Medan'
      }
    ]
  }
};

export const handleChatbotQuery: RequestHandler = async (req, res) => {
  try {
    const { message }: ChatbotQuery = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    const searchTerm = message.toLowerCase();
    
    // Find matching keywords
    const matchedKey = Object.keys(searchDatabase).find(key => 
      searchTerm.includes(key) || key.includes(searchTerm)
    );

    let response: ChatbotResponse;

    if (matchedKey) {
      const data = searchDatabase[matchedKey as keyof typeof searchDatabase];
      response = {
        response: data.response,
        links: data.links
      };
    } else {
      response = {
        response: `Maaf, saya tidak menemukan data spesifik untuk "${message}". Silakan coba kata kunci lain seperti "kemiskinan", "penduduk", "ekonomi", "industri", "pendidikan", atau "kesehatan". Anda juga dapat mengunjungi halaman utama BPS Kota Medan untuk informasi lebih lengkap.`,
        links: [
          {
            title: 'BPS Kota Medan - Halaman Utama',
            url: 'https://medankota.bps.go.id/',
            description: 'Situs resmi Badan Pusat Statistik Kota Medan'
          },
          {
            title: 'Publikasi BPS Kota Medan',
            url: 'https://medankota.bps.go.id/publication',
            description: 'Daftar publikasi dan laporan statistik BPS Kota Medan'
          }
        ]
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.'
    });
  }
};
