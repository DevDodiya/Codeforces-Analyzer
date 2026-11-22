package org.dev.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.bson.Document;
import org.dev.Repository.CodeforcesRepository;
import org.dev.proxies.getRatedList;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the handle directory that powers search autocomplete.
 *
 * Codeforces has no public "handles starting with X" endpoint, so suggestions can
 * only come from handles we already store. On startup, if the directory is nearly
 * empty, this pulls the public {@code user.ratedList} (all rated users, strongest
 * first) once and bulk-loads the top N. Runs on a background thread so it never
 * blocks the app from becoming ready, and is idempotent (upsert keyed on handle).
 */
@ApplicationScoped
public class HandleSeeder {

    @Inject
    CodeforcesRepository repository;

    @Inject
    @RestClient
    getRatedList ratedListProxy;

    @ConfigProperty(name = "codeforces.seed.enabled", defaultValue = "true")
    boolean enabled;

    // How many top-rated handles to load into the directory.
    @ConfigProperty(name = "codeforces.seed.limit", defaultValue = "20000")
    int limit;

    // Only seed when fewer than this many handles are already stored.
    @ConfigProperty(name = "codeforces.seed.threshold", defaultValue = "1000")
    long threshold;

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int BATCH = 5000;

    void onStart(@Observes StartupEvent ev) {
        if (!enabled) {
            return;
        }
        Thread t = new Thread(this::seedIfNeeded, "handle-seeder");
        t.setDaemon(true);
        t.start();
    }

    private void seedIfNeeded() {
        try {
            // Give the repository's startup observer time to open its collections.
            long existing = awaitCount();
            if (existing >= threshold) {
                System.out.println("[seed] directory already has ~" + existing + " handles; skipping seed");
                return;
            }
            System.out.println("[seed] handle directory is sparse (~" + existing + "); seeding from user.ratedList…");
            int seeded = seed(limit);
            System.out.println("[seed] done — seeded " + seeded + " handles");
        } catch (Exception e) {
            System.out.println("[seed] skipped (non-fatal): " + e.getMessage());
        }
    }

    /**
     * Fetch the public rated list and bulk-load the top {@code max} handles.
     * Returns the number of handles upserted. Exposed for a manual re-seed endpoint.
     */
    public int seed(int max) throws Exception {
        String json = ratedListProxy.getRatedList(true, false);
        JsonNode root = MAPPER.readTree(json);
        JsonNode result = root.path("result");
        if (!result.isArray()) {
            return 0;
        }

        int total = 0;
        List<Document> batch = new ArrayList<>(BATCH);
        for (JsonNode u : result) {
            if (total >= max) {
                break;
            }
            String handle = u.path("handle").asText(null);
            if (handle == null || handle.isEmpty()) {
                continue;
            }
            Document doc = new Document("handle", handle)
                    .append("rating", u.path("rating").asInt(0))
                    .append("rank", u.path("rank").asText(""))
                    .append("maxRating", u.path("maxRating").asInt(0))
                    .append("maxRank", u.path("maxRank").asText(""))
                    .append("titlePhoto", u.path("titlePhoto").asText(""))
                    .append("avatar", u.path("avatar").asText(""))
                    .append("country", u.path("country").asText(""))
                    .append("organization", u.path("organization").asText(""));
            batch.add(doc);
            total++;
            if (batch.size() >= BATCH) {
                repository.seedHandles(batch);
                batch = new ArrayList<>(BATCH);
            }
        }
        if (!batch.isEmpty()) {
            repository.seedHandles(batch);
        }
        return total;
    }

    /** Wait (briefly) for the repository to be ready, returning the current handle count. */
    private long awaitCount() {
        for (int i = 0; i < 20; i++) {
            try {
                return repository.countHandles();
            } catch (Exception e) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return 0;
                }
            }
        }
        return 0;
    }
}
