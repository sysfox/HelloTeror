import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const images = [
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/welcome/hero_endframe__fwev9ebh42mq_xlarge.jpg",
    path: "images/hero_endframe.jpg",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/highlights/highlights_chip_endframe__dp975gwqppw2_large.jpg",
    path: "images/highlights_chip.jpg",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/highlights/highlights_ai__c1tao33ompea_large.webp",
    path: "images/highlights_ai.webp",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/highlights/highlights_battery__d7riytopt742_large.jpg",
    path: "images/highlights_battery.jpg",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/highlights/highlights_liquid_glass__fup1pqvqx866_large.webp",
    path: "images/highlights_liquid_glass.webp",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/highlights/highlights_mac_iphone__cxajkjnjbx26_large.webp",
    path: "images/highlights_mac_iphone.webp",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/product-viewer/pv_hero_endframe__gc89p7dw1syi_large.webp",
    path: "images/pv_hero_endframe.webp",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/product-viewer/pv_sizes_endframe__eydbew72wkom_large.jpg",
    path: "images/pv_sizes_endframe.jpg",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/product-viewer/pv_colors_spaceblack__dwfpyrbaf4cy_large.jpg",
    path: "images/pv_colors_spaceblack.jpg",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/product-viewer/pv_colors_silver__doa20s4tupaq_large.jpg",
    path: "images/pv_colors_silver.jpg",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/product-viewer/pv_display__fv0jzlzaak2u_large.webp",
    path: "images/pv_display.webp",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/product-viewer/pv_connectivity__27f84rcgb42e_large.webp",
    path: "images/pv_connectivity.webp",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/product-viewer/pv_camera_endframe__3d423kiwog2y_large.webp",
    path: "images/pv_camera_endframe.webp",
  },
  {
    url: "https://www.apple.com.cn/macbook-pro/images/overview/product-viewer/pv_audio_endframe__ee95uehal7sm_large.webp",
    path: "images/pv_audio_endframe.webp",
  },
  {
    url: "https://www.apple.com.cn/v/macbook-pro/ax/images/overview/product-viewer/pv_durable__ee5bejbfpis2_large.jpg",
    path: "images/pv_durable.jpg",
  },
];

async function downloadImage(url, filePath) {
  const fullPath = join(publicDir, filePath);
  await mkdir(dirname(fullPath), { recursive: true });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.warn(`Failed to download ${url}: ${res.status}`);
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(fullPath, buffer);
    console.log(`Downloaded: ${filePath}`);
    return true;
  } catch (err) {
    console.warn(`Error downloading ${url}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("Downloading assets...");

  const batchSize = 4;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    await Promise.all(batch.map((img) => downloadImage(img.url, img.path)));
  }

  console.log("Done downloading assets.");
}

main().catch(console.error);
