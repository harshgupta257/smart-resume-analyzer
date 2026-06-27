# skill_keywords.py
# Curated list of tech and professional skills for keyword matching

TECH_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go", "golang",
    "rust", "swift", "kotlin", "ruby", "php", "scala", "r", "matlab", "perl",
    "bash", "shell", "powershell", "dart", "lua", "haskell", "elixir", "clojure",

    # Web Frontend
    "html", "css", "react", "reactjs", "react.js", "angular", "angularjs", "vue",
    "vuejs", "vue.js", "nextjs", "next.js", "nuxtjs", "svelte", "jquery",
    "bootstrap", "tailwind", "tailwindcss", "sass", "scss", "less", "webpack",
    "vite", "parcel", "babel", "redux", "mobx", "zustand", "graphql",

    # Web Backend
    "fastapi", "flask", "django", "express", "expressjs", "spring", "springboot",
    "spring boot", "laravel", "rails", "rubyonrails", "nestjs", "node", "nodejs",
    "node.js", "asp.net", "dotnet", ".net", "gin", "fiber", "fasthttp",
    "restapi", "rest", "restful", "api", "microservices", "grpc", "websocket",
    "websockets", "graphql", "soap",

    # Databases
    "sql", "mysql", "postgresql", "postgres", "sqlite", "mongodb", "redis",
    "cassandra", "dynamodb", "elasticsearch", "neo4j", "oracle", "mariadb",
    "mssql", "firestore", "supabase", "prisma", "sqlalchemy", "orm", "nosql",
    "firebase", "influxdb",

    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "cloud", "docker", "kubernetes",
    "k8s", "terraform", "ansible", "jenkins", "circleci", "github actions",
    "gitlab ci", "ci/cd", "devops", "helm", "prometheus", "grafana", "nginx",
    "apache", "linux", "ubuntu", "debian", "centos", "serverless", "lambda",
    "ec2", "s3", "rds", "cloudfront",

    # Data Science & ML
    "machine learning", "ml", "deep learning", "dl", "artificial intelligence",
    "ai", "nlp", "natural language processing", "computer vision", "cv",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas",
    "numpy", "matplotlib", "seaborn", "plotly", "jupyter", "notebook",
    "huggingface", "transformers", "llm", "openai", "langchain", "rag",
    "data science", "data analysis", "data engineering", "etl", "spark",
    "hadoop", "airflow", "dbt", "tableau", "powerbi", "looker",

    # Version Control & Tools
    "git", "github", "gitlab", "bitbucket", "svn", "jira", "confluence",
    "slack", "notion", "trello", "figma", "postman", "swagger", "openapi",

    # Testing
    "unit testing", "integration testing", "pytest", "unittest", "jest",
    "mocha", "chai", "selenium", "playwright", "cypress", "testing",
    "tdd", "bdd",

    # Architecture & Concepts
    "oop", "object oriented", "functional programming", "design patterns",
    "solid principles", "microservices", "monolith", "event driven",
    "message queue", "kafka", "rabbitmq", "celery", "async", "multithreading",
    "concurrency", "caching", "load balancing", "scalability", "agile",
    "scrum", "kanban",

    # Security
    "cybersecurity", "authentication", "authorization", "jwt", "oauth",
    "ssl", "tls", "encryption", "hashing", "penetration testing",

    # Mobile
    "android", "ios", "react native", "flutter", "xamarin", "swift",
}

SOFT_SKILLS = {
    "communication", "leadership", "teamwork", "collaboration", "problem solving",
    "analytical", "critical thinking", "time management", "adaptability",
    "creativity", "project management", "mentoring", "presentation",
    "documentation", "agile", "scrum", "cross-functional",
}

ALL_SKILLS = TECH_SKILLS | SOFT_SKILLS
