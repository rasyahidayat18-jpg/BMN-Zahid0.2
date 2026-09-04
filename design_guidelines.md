{
  "meta": {
    "product_name": "SISTEM MONITORING BMN DAN BARANG PERSEDIAAN",
    "organization": "Kantor Imigrasi Takengon",
    "language": "id-ID (Bahasa Indonesia)",
    "app_type": "internal government admin dashboard",
    "design_personality": [
      "resmi & kredibel (institutional)",
      "tenang, minim distraksi",
      "data-dense tapi tetap lega",
      "aksesibel (kontras jelas, fokus terlihat)",
      "modern shadcn—bukan template generik"
    ],
    "north_star": "Pengguna bisa memantau kondisi aset BMN, alur persetujuan pemeliharaan & permintaan persediaan, serta audit trail dengan cepat dan tanpa kebingungan."
  },

  "design_inspiration": {
    "references": [
      {
        "source": "shadcnblocks",
        "url": "https://www.shadcnblocks.com/block/dashboard6",
        "takeaways": [
          "Shell dashboard: sidebar + header + grid KPI + panel chart",
          "Kartu KPI ringkas dengan label kecil + angka besar",
          "Panel progress/riwayat untuk monitoring operasional"
        ]
      },
      {
        "source": "INA Digital Design System (IDDS)",
        "url": "https://design.inadigital.go.id/foundation/color/",
        "takeaways": [
          "Gunakan sistem warna berbasis fungsi (brand/sentiment/neutral)",
          "Hindari gradient pada tipografi",
          "Brand mode memungkinkan varian biru/navy yang tetap institusional"
        ]
      }
    ],
    "fusion_direction": "Layout enterprise (sidebar + topbar + content grid) + warna institusional navy/blue ala IDDS + detail micro-interaction modern (hover ring halus, skeleton, empty states) + galeri foto aset ala produk asset-management (lightbox, cover photo)."
  },

  "design_tokens": {
    "fonts": {
      "heading": {
        "google_font": "Space Grotesk",
        "fallback": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      },
      "body": {
        "google_font": "Inter",
        "fallback": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      },
      "mono": {
        "google_font": "IBM Plex Mono",
        "fallback": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace"
      },
      "notes": "Heading pakai Space Grotesk untuk rasa modern-institusional; body Inter untuk keterbacaan tabel panjang."
    },

    "typography_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-lg font-semibold tracking-tight",
      "card_kpi_value": "text-2xl md:text-3xl font-semibold tracking-tight",
      "table": "text-sm",
      "caption": "text-xs text-muted-foreground"
    },

    "radius": {
      "app": "--radius: 0.75rem; (12px)",
      "card": "rounded-xl",
      "button": "rounded-lg",
      "input": "rounded-lg",
      "badge": "rounded-full"
    },

    "shadows": {
      "card": "shadow-[0_1px_0_hsl(var(--border))] shadow-sm",
      "popover": "shadow-lg shadow-black/5",
      "focus": "ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))]"
    },

    "spacing": {
      "page_padding": "px-4 sm:px-6 lg:px-8",
      "section_gap": "gap-6",
      "card_padding": "p-4 md:p-5",
      "form_gap": "gap-4",
      "table_density": {
        "default": "py-3",
        "compact_toggle": "py-2 (opsional untuk power users)"
      },
      "rule": "Gunakan 2–3x lebih banyak whitespace daripada terasa nyaman; dashboard tetap rapi walau data padat."
    },

    "color_system": {
      "intent": "Light theme utama. Navy sebagai brand primary; neutral bersih; sentiment jelas untuk status aset & approval.",
      "css_variables_hsl": {
        "background": "210 33% 98%",
        "foreground": "222 47% 11%",
        "card": "0 0% 100%",
        "card-foreground": "222 47% 11%",
        "popover": "0 0% 100%",
        "popover-foreground": "222 47% 11%",

        "primary": "214 78% 24%",
        "primary-foreground": "210 40% 98%",

        "secondary": "210 24% 96%",
        "secondary-foreground": "222 47% 11%",

        "muted": "210 24% 96%",
        "muted-foreground": "215 16% 40%",

        "accent": "210 24% 94%",
        "accent-foreground": "214 78% 24%",

        "border": "214 20% 88%",
        "input": "214 20% 88%",
        "ring": "214 78% 34%",

        "destructive": "0 72% 51%",
        "destructive-foreground": "210 40% 98%",

        "success": "152 55% 33%",
        "success-foreground": "210 40% 98%",
        "warning": "38 92% 45%",
        "warning-foreground": "222 47% 11%",
        "info": "205 90% 40%",
        "info-foreground": "210 40% 98%",

        "chart-1": "214 78% 34%",
        "chart-2": "152 55% 33%",
        "chart-3": "38 92% 45%",
        "chart-4": "0 72% 51%",
        "chart-5": "215 16% 40%"
      },
      "gradient_usage": {
        "allowed": [
          "Hanya untuk background hero kecil di halaman Login (maks 15–20% viewport)",
          "Decorative top border tipis pada header (2–4px)"
        ],
        "safe_gradients": [
          "from-slate-50 via-white to-sky-50 (sangat ringan)",
          "from-white via-white to-slate-50"
        ],
        "prohibited": "Ikuti GRADIENT RESTRICTION RULE (tidak pakai gradient gelap/saturated; tidak untuk area baca)."
      },
      "semantic_status_badges": {
        "kondisi_aset": {
          "Baik": {
            "bg": "bg-emerald-50",
            "text": "text-emerald-800",
            "border": "border-emerald-200",
            "dot": "bg-emerald-500"
          },
          "Rusak Ringan": {
            "bg": "bg-amber-50",
            "text": "text-amber-900",
            "border": "border-amber-200",
            "dot": "bg-amber-500"
          },
          "Rusak Berat": {
            "bg": "bg-rose-50",
            "text": "text-rose-800",
            "border": "border-rose-200",
            "dot": "bg-rose-500"
          }
        },
        "approval": {
          "Diajukan": {
            "bg": "bg-sky-50",
            "text": "text-sky-800",
            "border": "border-sky-200"
          },
          "Menunggu Persetujuan": {
            "bg": "bg-indigo-50",
            "text": "text-indigo-800",
            "border": "border-indigo-200"
          },
          "Disetujui": {
            "bg": "bg-emerald-50",
            "text": "text-emerald-800",
            "border": "border-emerald-200"
          },
          "Ditolak": {
            "bg": "bg-rose-50",
            "text": "text-rose-800",
            "border": "border-rose-200"
          },
          "Selesai": {
            "bg": "bg-slate-100",
            "text": "text-slate-800",
            "border": "border-slate-200"
          }
        },
        "read_state": {
          "Belum dibaca": {
            "bg": "bg-sky-50",
            "text": "text-sky-900",
            "border": "border-sky-200"
          },
          "Sudah dibaca": {
            "bg": "bg-slate-50",
            "text": "text-slate-700",
            "border": "border-slate-200"
          }
        }
      }
    },

    "global_css_notes": {
      "index_css_update": {
        "what": "Ganti token :root di /app/frontend/src/index.css agar sesuai palette institusional. Tambahkan token success/warning/info (custom) untuk badge & toast.",
        "how": "Tambahkan CSS variables baru di :root dan .dark (opsional). Jangan ubah backend."
      },
      "app_css_cleanup": {
        "what": "Hapus styling CRA default di App.css (App-header center, logo spin) agar tidak mengganggu layout dashboard.",
        "rule": "Jangan menambahkan .App { text-align:center }"
      }
    }
  },

  "layout_system": {
    "app_shell": {
      "pattern": "Left sidebar + top header + scrollable main",
      "grid": {
        "content_max_width": "max-w-[1400px] (desktop), full width untuk tabel",
        "kpi_grid": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        "dashboard_panels": "grid grid-cols-1 lg:grid-cols-3 gap-6 (chart besar 2 kolom + panel list 1 kolom)"
      },
      "sidebar": {
        "width": "w-[280px] (desktop)",
        "collapsed": "w-[72px] (ikon saja)",
        "mobile": "gunakan Sheet/Drawer",
        "visual": "bg-white/90 backdrop-blur border-r",
        "active_item": "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-medium",
        "group_label": "text-xs uppercase tracking-wide text-muted-foreground px-3"
      },
      "topbar": {
        "height": "h-14",
        "elements": [
          "Breadcrumb (opsional)",
          "Search (Command) untuk cari aset/permintaan",
          "Bell notifications + badge",
          "Avatar + dropdown profil"
        ],
        "sticky": "sticky top-0 z-30 bg-background/80 backdrop-blur border-b"
      }
    },

    "page_templates": {
      "dashboard": {
        "sections": [
          "Kartu Statistik (BMN total, Rusak, Permintaan pending, Pemeliharaan pending)",
          "Chart: Pie kondisi aset + Bar permintaan per status",
          "Daftar: Aktivitas terbaru + Notifikasi terbaru"
        ]
      },
      "table_pages": {
        "pages": [
          "Data Aset BMN",
          "Riwayat Pemeliharaan",
          "Monitoring & Riwayat Permintaan",
          "Audit Trail",
          "Manajemen User",
          "Manajemen Role"
        ],
        "table_header": "Judul + deskripsi singkat + actions (Tambah/Export) + search/filter row",
        "table_footer": "Pagination + jumlah data + pilihan densitas (opsional)"
      },
      "detail_pages": {
        "pages": ["Detail Aset"],
        "layout": "2 kolom desktop: kiri galeri foto, kanan ringkasan + status + aksi; mobile jadi stack",
        "sticky_actions": "di mobile, tombol aksi utama sticky bottom (optional)"
      },
      "form_pages": {
        "pages": [
          "Tambah/Edit Aset",
          "Pemeliharaan Aset",
          "Ajukan Permintaan Barang",
          "Pengaturan",
          "Profil Pengguna"
        ],
        "pattern": "Card sections dengan judul kecil + helper text; validasi inline; tombol submit selalu di kanan bawah pada desktop"
      }
    }
  },

  "components": {
    "component_path": {
      "shadcn_ui": {
        "button": "/app/frontend/src/components/ui/button.jsx",
        "input": "/app/frontend/src/components/ui/input.jsx",
        "textarea": "/app/frontend/src/components/ui/textarea.jsx",
        "select": "/app/frontend/src/components/ui/select.jsx",
        "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
        "switch": "/app/frontend/src/components/ui/switch.jsx",
        "badge": "/app/frontend/src/components/ui/badge.jsx",
        "card": "/app/frontend/src/components/ui/card.jsx",
        "table": "/app/frontend/src/components/ui/table.jsx",
        "pagination": "/app/frontend/src/components/ui/pagination.jsx",
        "tabs": "/app/frontend/src/components/ui/tabs.jsx",
        "dialog": "/app/frontend/src/components/ui/dialog.jsx",
        "drawer": "/app/frontend/src/components/ui/drawer.jsx",
        "sheet": "/app/frontend/src/components/ui/sheet.jsx",
        "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
        "popover": "/app/frontend/src/components/ui/popover.jsx",
        "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
        "command": "/app/frontend/src/components/ui/command.jsx",
        "calendar": "/app/frontend/src/components/ui/calendar.jsx",
        "breadcrumb": "/app/frontend/src/components/ui/breadcrumb.jsx",
        "separator": "/app/frontend/src/components/ui/separator.jsx",
        "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
        "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
        "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx"
      },
      "icons": {
        "library": "lucide-react",
        "notes": "Gunakan ikon outline sederhana (Home, LayoutDashboard, Package, Wrench, Bell, Users, FileText, ShieldCheck)."
      },
      "charts": {
        "library": "recharts",
        "notes": "Warna chart harus pakai CSS variables --chart-1..5 agar konsisten tema."
      }
    },

    "buttons": {
      "style": "Professional / Corporate",
      "variants": {
        "primary": {
          "use": "Aksi utama: Simpan, Ajukan, Setujui",
          "classes": "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          "motion": "hover: brightness(0.98); active: scale-[0.98]"
        },
        "secondary": {
          "use": "Aksi pendamping: Filter, Lihat Detail",
          "classes": "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80 border border-[hsl(var(--border))]",
          "motion": "hover: translateY(-1px) shadow-sm"
        },
        "ghost": {
          "use": "Aksi di tabel/topbar: ikon, menu",
          "classes": "hover:bg-[hsl(var(--accent))] text-foreground",
          "motion": "hover: background fade 150ms"
        },
        "destructive": {
          "use": "Hapus aset/user",
          "classes": "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90"
        }
      },
      "sizes": {
        "sm": "h-8 px-3 text-sm",
        "md": "h-9 px-4 text-sm",
        "lg": "h-10 px-5 text-sm"
      },
      "rule": "Jangan pakai transition: all. Gunakan transition-colors untuk hover/focus."
    },

    "sidebar_menu": {
      "role_based": {
        "rule": "Sidebar items dirender berdasarkan role. Gunakan grouping + label section.",
        "example_groups": [
          "Monitoring",
          "BMN",
          "Persediaan",
          "Persetujuan",
          "Administrasi",
          "Laporan & Audit"
        ]
      },
      "item_spec": {
        "classes": "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--accent))]",
        "active": "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]",
        "icon": "size-4",
        "data_testid": "sidebar-nav-item-<slug>"
      }
    },

    "stat_cards": {
      "pattern": "Card + icon + value + delta",
      "classes": "rounded-xl border bg-card p-4 md:p-5",
      "kpi_value": "text-2xl md:text-3xl font-semibold tracking-tight",
      "kpi_label": "text-xs text-muted-foreground",
      "delta": {
        "positive": "text-emerald-700",
        "negative": "text-rose-700",
        "neutral": "text-slate-600"
      },
      "micro": "Hover: border jadi sedikit lebih gelap + shadow-sm (transition-colors)."
    },

    "tables": {
      "style": "High-density, scan-friendly",
      "header": "bg-[hsl(var(--secondary))] text-xs uppercase tracking-wide text-muted-foreground",
      "row": "hover:bg-[hsl(var(--accent))]",
      "cell": "py-3 align-middle",
      "thumbnail": "Gunakan Avatar/AspectRatio untuk thumbnail 48x48, rounded-md, border",
      "actions": "DropdownMenu (kebab) di kolom terakhir",
      "empty_state": "Card dengan ikon + teks + tombol CTA",
      "loading": "Skeleton rows",
      "data_testid": {
        "table": "data-table-<entity>",
        "search": "data-table-search-input",
        "filter": "data-table-filter-button",
        "export": "data-table-export-button",
        "pagination_next": "data-table-pagination-next",
        "pagination_prev": "data-table-pagination-prev"
      }
    },

    "filters_search": {
      "search": "Input dengan icon Search di kiri; placeholder Bahasa Indonesia (mis. 'Cari aset berdasarkan kode/nama...')",
      "advanced_filter": "Popover/Sheet berisi Select, Calendar range, Checkbox status",
      "chips": "Badge variant outline untuk filter aktif + tombol 'Reset'"
    },

    "notifications": {
      "bell": "Button ghost icon Bell + badge count kecil (Badge) posisi absolute",
      "dropdown": "DropdownMenu atau Popover: list 6 item terbaru + tombol 'Lihat semua'",
      "list_page": "Tabs: Semua / Belum dibaca / Dibaca",
      "item": "Row clickable dengan indikator dot untuk unread",
      "data_testid": {
        "bell": "topbar-notification-bell-button",
        "badge": "topbar-notification-count",
        "dropdown": "topbar-notification-dropdown",
        "mark_read": "notification-mark-read-button"
      }
    },

    "photo_gallery": {
      "asset_detail": {
        "primary_photo": "AspectRatio 16/10, rounded-xl, border, background muted",
        "thumbnail_strip": "ScrollArea horizontal, thumbnail 72x72, ring saat aktif",
        "lightbox": "Dialog full-screen: gambar besar + tombol next/prev + download (opsional)"
      },
      "uploader": {
        "pattern": "Drag-and-drop zone + preview grid + set cover",
        "dropzone_classes": "rounded-xl border border-dashed bg-[hsl(var(--secondary))] p-6 text-sm text-muted-foreground",
        "preview_grid": "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
        "preview_card": "relative rounded-lg border bg-card overflow-hidden",
        "cover_badge": "Badge kecil 'Sampul' di pojok kiri atas",
        "actions": "Button ghost kecil: Hapus / Jadikan Sampul",
        "data_testid": {
          "dropzone": "asset-photo-dropzone",
          "file_input": "asset-photo-file-input",
          "set_cover": "asset-photo-set-cover-button",
          "remove": "asset-photo-remove-button"
        }
      }
    },

    "approval_timeline": {
      "pattern": "Vertical timeline (3 tier) dengan status badge + timestamp + catatan",
      "visual": "Garis kiri tipis + node bulat; node warna sesuai status",
      "components": "Card + Badge + Separator",
      "data_testid": "approval-timeline"
    },

    "reports_export": {
      "tabs": "Tabs: BMN / Persediaan / Pemeliharaan / Audit",
      "filters": "Date range (Calendar), lokasi, kondisi, status approval",
      "export_buttons": "Button secondary: Export CSV, Export Excel, Export PDF",
      "data_testid": {
        "export_csv": "report-export-csv-button",
        "export_excel": "report-export-excel-button",
        "export_pdf": "report-export-pdf-button"
      }
    },

    "audit_trail": {
      "table": "Kolom: Waktu, Pengguna, Aksi, Entitas, Detail (monospace untuk ID)",
      "detail_popover": "Popover untuk JSON ringkas (read-only)"
    }
  },

  "motion_microinteractions": {
    "principles": [
      "Motion harus fungsional: memberi feedback, bukan dekorasi",
      "Durasi 120–180ms untuk hover; 180–240ms untuk dialog/sheet",
      "Gunakan easing: ease-out untuk masuk, ease-in untuk keluar"
    ],
    "tailwind_patterns": {
      "hover": "transition-colors duration-150",
      "press": "active:scale-[0.98] transition-transform duration-150",
      "panel_enter": "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
      "panel_exit": "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
    },
    "scroll": {
      "topbar_shadow": "Saat scroll, tambahkan shadow-sm pada topbar (via state) untuk depth halus."
    }
  },

  "charts_recharts": {
    "styling": {
      "rule": "Jangan hardcode hex. Pakai CSS variables: hsl(var(--chart-1)) dst.",
      "pie": {
        "stroke": "stroke-white",
        "legend": "text-xs text-muted-foreground"
      },
      "bar": {
        "radius": 6,
        "grid": "stroke-[hsl(var(--border))]"
      }
    },
    "example_palette_mapping": {
      "Baik": "hsl(var(--chart-2))",
      "Rusak Ringan": "hsl(var(--chart-3))",
      "Rusak Berat": "hsl(var(--chart-4))",
      "Permintaan": "hsl(var(--chart-1))"
    }
  },

  "accessibility": {
    "requirements": [
      "Kontras teks minimal WCAG AA (terutama badge & tombol)",
      "Focus ring selalu terlihat (jangan dihapus)",
      "Target sentuh minimal 44px untuk mobile",
      "Gunakan aria-label untuk ikon-only buttons (Bell, kebab menu)",
      "Gunakan bahasa Indonesia konsisten (mis. 'Disetujui', 'Ditolak', 'Menunggu Persetujuan')"
    ],
    "keyboard": [
      "DropdownMenu, Dialog, Sheet harus bisa diakses via keyboard",
      "Table row actions jangan hanya hover; sediakan tombol aksi jelas"
    ]
  },

  "image_urls": {
    "login_hero_background": [
      {
        "url": "https://images.unsplash.com/photo-1697968652402-0b4a38964be1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxpbmRvbmVzaWElMjBnb3Zlcm5tZW50JTIwb2ZmaWNlJTIwYnVpbGRpbmclMjBleHRlcmlvcnxlbnwwfHx8Ymx1ZXwxNzg4NDg5ODExfDA&ixlib=rb-4.1.0&q=85",
        "category": "login",
        "description": "Foto institusional (bendera/gedung) untuk panel samping login desktop; gunakan overlay putih 70–80% agar teks tetap terbaca."
      },
      {
        "url": "https://images.unsplash.com/photo-1602054328206-78cf49d245af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxpbmRvbmVzaWElMjBnb3Zlcm5tZW50JTIwb2ZmaWNlJTIwYnVpbGRpbmclMjBleHRlcmlvcnxlbnwwfHx8Ymx1ZXwxNzg4NDg5ODExfDA&ixlib=rb-4.1.0&q=85",
        "category": "login",
        "description": "Alternatif background login; crop 4:5 untuk panel kiri."
      }
    ],
    "inventory_context_optional": [
      {
        "url": "https://images.unsplash.com/photo-1656232328904-8e2a87cac21d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHx3YXJlaG91c2UlMjBzaGVsdmVzJTIwaW52ZW50b3J5fGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc4ODQ4OTgyNHww&ixlib=rb-4.1.0&q=85",
        "category": "empty_state",
        "description": "Foto gudang (B/W) untuk empty state halaman Persediaan (opsional). Gunakan opacity rendah (10–15%) sebagai watermark agar tidak ramai."
      }
    ]
  },

  "libraries": {
    "recommended": [
      {
        "name": "framer-motion",
        "why": "Animasi halus untuk sidebar collapse, dialog transitions, list entrance (opsional tapi meningkatkan polish).",
        "install": "npm i framer-motion",
        "usage_notes": "Gunakan hanya untuk container besar; jangan animasikan semua elemen kecil."
      },
      {
        "name": "@tanstack/react-table",
        "why": "Tabel modern: sorting/filter/pagination yang scalable.",
        "install": "npm i @tanstack/react-table",
        "usage_notes": "Integrasikan dengan shadcn Table; pastikan semua kontrol punya data-testid."
      }
    ]
  },

  "instructions_to_main_agent": [
    "Update /app/frontend/src/index.css token :root sesuai design_tokens.color_system.css_variables_hsl. Tambahkan token success/warning/info (custom) bila belum ada.",
    "Bersihkan /app/frontend/src/App.css dari CRA default (logo spin, App-header center).",
    "Implementasikan App Shell: Sidebar (desktop) + Sheet (mobile) + Topbar sticky. Semua menu sidebar berbasis role.",
    "Gunakan shadcn components dari /app/frontend/src/components/ui (jangan HTML dropdown/calendar/toast).",
    "Semua elemen interaktif & info penting wajib punya data-testid (kebab-case).",
    "Status badge: gunakan mapping semantic_status_badges untuk kondisi aset & approval.",
    "Charts Recharts: gunakan hsl(var(--chart-*)); jangan hardcode warna.",
    "Galeri foto aset: primary photo + thumbnail strip + Dialog lightbox; uploader drag-drop + set cover.",
    "Bahasa UI konsisten Bahasa Indonesia; gunakan istilah formal (Ajukan, Setujui, Tolak, Riwayat, Audit Trail)."
  ],

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
