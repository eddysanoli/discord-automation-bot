-- Bot Info Table Structure

CREATE TABLE
    IF NOT EXISTS bot_info (
        id VARCHAR(50) PRIMARY KEY,
        is_online BOOLEAN DEFAULT true NOT NULL
    );

-- Populate Bot Info Table

INSERT INTO
    bot_info (id, is_online)
VALUES ('automation_bot', true);