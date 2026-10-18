package com.smartjob.server;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class JobController {

    @GetMapping("/api/jobs")
    public List<Map<String, Object>> getJobs() {

        return List.of(
            Map.of(
                "id", 1,
                "title", "Frontend Developer",
                "company", "Tech Solutions",
                "location", "Colombo",
                "salary", "Rs. 80,000 - 150,000"
            ),
            Map.of(
                "id", 2,
                "title", "UI/UX Designer",
                "company", "Creative Studio",
                "location", "Kandy",
                "salary", "Rs. 60,000 - 120,000"
            ),
            Map.of(
                "id", 3,
                "title", "Software Engineer",
                "company", "Digital Lanka",
                "location", "Galle",
                "salary", "Rs. 100,000 - 200,000"
            )
        );
    }
}
