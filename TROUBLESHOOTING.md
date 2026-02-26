# Troubleshooting Guide

This document covers common issues and their solutions when working with the Cuma Baca monorepo.

## Package Manager Issues

### Issue: "Cannot read properties of null (reading 'matches')"

**Problem:** Using `npm install` fails with a null reference error.

**Cause:** The project uses pnpm workspaces, which are incompatible with npm's workspace implementation.

**Solution:** Always use `pnpm` instead of `npm`:
```bash
# Install pnpm globally if needed
npm install -g pnpm

# Then use pnpm for all operations
pnpm install
pnpm run dev
pnpm run build
```

---

## Docker Issues

### Issue: Container fails to start with permission errors

**Problem:** Backend container exits with EACCES permission errors.

**Cause:** SELinux or file permissions preventing container from accessing mounted volumes.

**Solutions:**

1. **Add :Z flag to volume mount** (already configured in docker-compose.dev.yml):
   ```yaml
   volumes:
     - ./backend:/app:Z
   ```

2. **Check file permissions:**
   ```bash
   ls -la backend/
   # Ensure files are readable
   ```

3. **Rebuild container after permissions fix:**
   ```bash
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml build --no-cache backend
   docker compose -f docker-compose.dev.yml up -d
   ```

### Issue: "Cannot find module" errors in container

**Problem:** Container starts but crashes with module not found errors.

**Cause:** The volume mount overrides the node_modules installed during the build.

**Solution:** The named volume `backend_node_modules` should persist the installed modules. If issues persist:
```bash
# Remove the named volume
docker volume rm cumabaca_backend_node_modules

# Rebuild and restart
docker compose -f docker-compose.dev.yml build --no-cache backend
docker compose -f docker-compose.dev.yml up -d
```

### Issue: MongoDB connection fails

**Problem:** Backend logs show MongoDB connection errors.

**Solutions:**

1. **Check MongoDB container is running:**
   ```bash
   docker ps | grep mongo
   ```

2. **Check MongoDB logs:**
   ```bash
   docker logs cumabaca-mongo-dev
   ```

3. **Verify connection string:**
   - In Docker: `mongodb://mongodb:27017/cumabaca`
   - Local: `mongodb://localhost:27017/cumabaca`

4. **Restart MongoDB:**
   ```bash
   docker compose -f docker-compose.dev.yml restart mongodb
   ```

---

## Frontend Issues

### Issue: Vite dev server won't start

**Problem:** Frontend fails to start with module resolution errors.

**Solutions:**

1. **Ensure dependencies are installed:**
   ```bash
   pnpm install
   ```

2. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules frontend/node_modules backend/node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Check port availability:**
   ```bash
   # Check if port 5173 is already in use
   lsof -i :5173
   # Or use a different port
   pnpm run dev -- --port 5174
   ```

### Issue: API requests fail with CORS errors

**Problem:** Frontend can't connect to backend due to CORS.

**Solutions:**

1. **Check backend CORS configuration:**
   ```bash
   curl -I -H "Origin: http://localhost:5173" http://localhost:3100/komik/cache/stats
   # Should see: Access-Control-Allow-Origin: http://localhost:5173
   ```

2. **Verify CORS_ORIGIN environment variable:**
   ```bash
   # In docker-compose.dev.yml
   environment:
     - CORS_ORIGIN=http://localhost:5173
   ```

3. **Check backend is running:**
   ```bash
   curl http://localhost:3100/komik/cache/stats
   ```

---

## Scraping Issues

### Issue: Scraper returns 404 for valid URLs

**Problem:** API returns 404 errors for known working comic URLs.

**Possible Causes:**

1. **Website temporarily unavailable** - Wait and retry
2. **Website structure changed** - Scraper needs update
3. **Rate limiting** - Too many requests too quickly
4. **Cloudflare protection** - Headless browser detected

**Solutions:**

1. **Test URL directly:**
   ```bash
   curl -L "https://komiku.org/manga/one-piece"
   ```

2. **Use test scraper utility:**
   ```bash
   node test-scraper.js https://komiku.org/manga/one-piece --verbose
   ```

3. **Check scraper logs:**
   ```bash
   docker logs cumabaca-backend-dev | tail -50
   ```

4. **Wait and retry** - Some sites have rate limiting

---

## Performance Issues

### Issue: First scrape is very slow

**Problem:** Initial comic load takes 10+ seconds.

**Cause:** First request requires website fetching and parsing. Subsequent requests use cache.

**Solution:** This is expected behavior. Check cache stats:
```bash
curl http://localhost:3100/komik/cache/stats
```

### Issue: Cache not working

**Problem:** Every request is slow, cache appears empty.

**Solutions:**

1. **Check MongoDB connection:**
   ```bash
   docker logs cumabaca-backend-dev | grep MongoDB
   ```

2. **Verify cache collection exists:**
   ```bash
   # Connect to MongoDB
   docker exec -it cumabaca-mongo-dev mongosh
   > use cumabaca
   > show collections
   > db.cache.count()
   ```

3. **Clear and rebuild cache:**
   ```bash
   curl -X DELETE http://localhost:3100/komik/cache
   ```

---

## Development Environment Issues

### Issue: Hot-reload not working

**Problem:** Code changes don't reflect without restarting containers.

**Solutions:**

1. **Check volume mounts are correct:**
   ```yaml
   volumes:
     - ./backend:/app:Z
   ```

2. **Verify nodemon is running in container:**
   ```bash
   docker logs cumabaca-backend-dev | grep nodemon
   ```

3. **Restart containers:**
   ```bash
   docker compose -f docker-compose.dev.yml restart backend
   ```

### Issue: Port already in use

**Problem:** Cannot start services due to port conflicts.

**Solutions:**

1. **Find and kill process using the port:**
   ```bash
   # For port 3100
   lsof -ti:3100 | xargs kill -9

   # For port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Or change ports in configuration:**
   - Backend: `bin/www` (change `app.set('port', process.env.PORT || 3100)`)
   - Frontend: `vite.config.js` (change `server.port`)
   - Docker: `docker-compose.dev.yml` (change port mappings)

---

## Getting Help

If none of these solutions work:

1. **Check logs:**
   ```bash
   docker logs cumabaca-backend-dev
   docker logs cumabaca-mongo-dev
   ```

2. **Review recent changes:**
   ```bash
   git log --oneline -10
   git diff
   ```

3. **Test components individually:**
   - Test MongoDB connection
   - Test backend API directly
   - Test frontend without backend

4. **Check system resources:**
   ```bash
   docker stats
   free -h
   df -h
   ```

5. **Review E2E_TEST_REPORT.md** for known issues and testing procedures
