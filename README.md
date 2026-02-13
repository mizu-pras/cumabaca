# Cuma Baca

A minimalist comic scraper from [komiku.org](https://komiku.org) and [komikcast.fit](https://v1.komikcast.fit), Cuma Baca (_Just Read_) focuses on delivering a clean, distraction-free reading experience.

- Node.js (v18)
- npm (v9)
- Express.js (v4)
- Playwright (for JavaScript-rendered websites)

## Demo

Visit the [Cuma Baca Website](https://cumabaca.com) to try it out.

## Local Setup

Follow these instructions to set up and run Cuma Baca on your local machine:

1. Clone the repository to your local machine.

    ```bash
    git clone <repository-url>
    ```

2. Navigate to the repository's directory.

    ```bash
    cd <repository-name>
    ```

3. Install the necessary dependencies.

    ```bash
    npm install
    npx playwright install chromium
    ```

4. Run the application in development mode.

    ```bash
    npm run dev
    ```

### Usage

Follow these steps to enjoy comics on Cuma Baca:

1. Visit one of the supported sites and find a comic you want to read:
   - [komiku.org](https://komiku.org)
   - [v1.komikcast.fit](https://v1.komikcast.fit)
2. Copy the comic's URL and paste it into the [Cuma Baca website](https://cumabaca.com).
   - Example (komiku.org): `https://komiku.org/manga/versatile-mage/`
   - Example (komikcast): `https://v1.komikcast.fit/series/the-games-top-troll`
3. Enjoy an uninterrupted reading experience.

### Screenshots

The platform is designed for a variety of devices.

#### Mobile

![Mobile view](/screenshot/mobile.PNG 'Mobile View')

#### Tablet

![Tablet view](/screenshot/tablet.jpg 'Tablet View')

#### Desktop

![Desktop view](/screenshot/desktop.png 'Desktop View')
