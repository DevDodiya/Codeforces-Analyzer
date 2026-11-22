package org.dev.proxies;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * Public Codeforces endpoint that lists every rated user (sorted by rating,
 * strongest first). No API signature required. Used once at startup to seed
 * the handle directory that powers search autocomplete.
 */
@RegisterRestClient(baseUri = "https://codeforces.com/api")
@ApplicationScoped
public interface getRatedList {

    @GET
    @Path("/user.ratedList")
    @Produces(MediaType.APPLICATION_JSON)
    String getRatedList(@QueryParam("activeOnly") boolean activeOnly,
                        @QueryParam("includeRetired") boolean includeRetired);
}
