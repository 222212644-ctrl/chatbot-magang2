import requests
from bs4 import BeautifulSoup
import json
import re
import sys
import urllib.parse
from typing import List, Dict
import time

class BPSMedanScraper:
    def __init__(self):
        self.base_url = "https://medankota.bps.go.id"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def search_links(self, keyword: str, max_results: int = 10) -> List[Dict]:
        """
        Search for links related to the keyword on BPS Medan website
        """
        results = []
        
        try:
            # Search in main pages
            main_results = self._search_main_pages(keyword)
            results.extend(main_results)
            
            # Search in statistics tables
            stats_results = self._search_statistics_tables(keyword)
            results.extend(stats_results)
            
            # Search in publications
            pub_results = self._search_publications(keyword)
            results.extend(pub_results)
            
            # Remove duplicates and limit results
            seen = set()
            unique_results = []
            for result in results:
                url_key = result['url']
                if url_key not in seen and len(unique_results) < max_results:
                    seen.add(url_key)
                    unique_results.append(result)
                    
            return unique_results
            
        except Exception as e:
            print(f"Error scraping BPS Medan: {e}", file=sys.stderr)
            return []
    
    def _search_main_pages(self, keyword: str) -> List[Dict]:
        """Search in main pages and navigation"""
        results = []
        
        try:
            response = self.session.get(self.base_url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Search in navigation links
            nav_links = soup.find_all('a', href=True)
            for link in nav_links:
                text = link.get_text(strip=True).lower()
                href = link.get('href')
                
                if keyword.lower() in text:
                    full_url = self._make_absolute_url(href)
                    if full_url and self._is_valid_bps_url(full_url):
                        results.append({
                            'title': link.get_text(strip=True),
                            'url': full_url,
                            'description': f'Halaman {link.get_text(strip=True)} dari website BPS Kota Medan',
                            'type': 'navigation'
                        })
                        
        except Exception as e:
            print(f"Error searching main pages: {e}", file=sys.stderr)
            
        return results
    
    def _search_statistics_tables(self, keyword: str) -> List[Dict]:
        """Search in statistics tables section"""
        results = []
        
        # Common statistics URLs to check
        stats_urls = [
            "/statistics-table",
            "/subject/12",  # Population
            "/subject/52",  # Economy/PDRB
            "/subject/563", # Poverty
            "/subject/15",  # Industry
            "/subject/28",  # Education
            "/subject/30",  # Health
        ]
        
        for stats_path in stats_urls:
            try:
                url = f"{self.base_url}{stats_path}"
                response = self.session.get(url, timeout=10)
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for relevant content
                tables = soup.find_all(['table', 'div'], class_=re.compile(r'table|data|statistic', re.I))
                links = soup.find_all('a', href=True)
                
                for link in links:
                    text = link.get_text(strip=True).lower()
                    href = link.get('href')
                    
                    if keyword.lower() in text or self._keyword_match(keyword, text):
                        full_url = self._make_absolute_url(href)
                        if full_url and self._is_valid_bps_url(full_url):
                            results.append({
                                'title': link.get_text(strip=True),
                                'url': full_url,
                                'description': f'Data statistik {keyword} dari BPS Kota Medan',
                                'type': 'statistics'
                            })
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error searching statistics for {stats_path}: {e}", file=sys.stderr)
                continue
                
        return results
    
    def _search_publications(self, keyword: str) -> List[Dict]:
        """Search in publications section"""
        results = []
        
        try:
            pub_url = f"{self.base_url}/publication"
            response = self.session.get(pub_url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for publication links
            pub_links = soup.find_all('a', href=True)
            
            for link in pub_links:
                text = link.get_text(strip=True).lower()
                href = link.get('href')
                
                if keyword.lower() in text or self._keyword_match(keyword, text):
                    full_url = self._make_absolute_url(href)
                    if full_url and self._is_valid_bps_url(full_url):
                        results.append({
                            'title': link.get_text(strip=True),
                            'url': full_url,
                            'description': f'Publikasi mengenai {keyword} dari BPS Kota Medan',
                            'type': 'publication'
                        })
                        
        except Exception as e:
            print(f"Error searching publications: {e}", file=sys.stderr)
            
        return results
    
    def _keyword_match(self, keyword: str, text: str) -> bool:
        """Check if keyword matches using various strategies"""
        keyword = keyword.lower()
        text = text.lower()
        
        # Direct match
        if keyword in text:
            return True
            
        # Related terms matching
        keyword_mappings = {
            'kemiskinan': ['poverty', 'miskin', 'kemiskinan', 'garis kemiskinan'],
            'penduduk': ['population', 'kependudukan', 'demografi', 'penduduk'],
            'ekonomi': ['economy', 'ekonomi', 'pdrb', 'gdp', 'produk domestik'],
            'industri': ['industry', 'industri', 'manufaktur', 'produksi'],
            'pendidikan': ['education', 'pendidikan', 'sekolah', 'universitas'],
            'kesehatan': ['health', 'kesehatan', 'rumah sakit', 'puskesmas'],
            'pertanian': ['agriculture', 'pertanian', 'perkebunan', 'kehutanan'],
            'perdagangan': ['trade', 'perdagangan', 'ekspor', 'impor'],
            'transportasi': ['transport', 'transportasi', 'angkutan'],
            'komunikasi': ['communication', 'komunikasi', 'telekomunikasi']
        }
        
        for key, related_terms in keyword_mappings.items():
            if keyword in related_terms:
                for term in related_terms:
                    if term in text:
                        return True
                        
        return False
    
    def _make_absolute_url(self, url: str) -> str:
        """Convert relative URL to absolute URL"""
        if not url:
            return ""
            
        if url.startswith('http'):
            return url
        elif url.startswith('/'):
            return f"{self.base_url}{url}"
        else:
            return f"{self.base_url}/{url}"
    
    def _is_valid_bps_url(self, url: str) -> bool:
        """Check if URL is valid and belongs to BPS domain"""
        if not url:
            return False
            
        # Must be BPS domain
        if 'medankota.bps.go.id' not in url:
            return False
            
        # Filter out unwanted file types
        unwanted_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
        if any(url.lower().endswith(ext) for ext in unwanted_extensions):
            return False
            
        return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python bps_scraper.py <keyword>")
        sys.exit(1)
        
    keyword = sys.argv[1]
    scraper = BPSMedanScraper()
    
    print(f"Searching for: {keyword}", file=sys.stderr)
    results = scraper.search_links(keyword)
    
    # Output results as JSON
    print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
