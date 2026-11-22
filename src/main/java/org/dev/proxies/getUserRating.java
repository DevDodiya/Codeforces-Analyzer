package org.dev.proxies;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(baseUri = "https://codeforces.com/api")
@ApplicationScoped
public interface getUserRating {

    @GET
    @Path("/user.rating")
    @Produces(MediaType.APPLICATION_JSON)
    String getUserRating(@QueryParam("handle") String handle);
}
