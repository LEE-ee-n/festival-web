| table_name             | column_name         | data_type                | is_nullable | column_default                            |
| ---------------------- | ------------------- | ------------------------ | ----------- | ----------------------------------------- |
| admin_users            | user_id             | uuid                     | NO          | null                                      |
| admin_users            | created_at          | timestamp with time zone | NO          | now()                                     |
| artist_aliases         | id                  | bigint                   | NO          | null                                      |
| artist_aliases         | artist_id           | bigint                   | NO          | null                                      |
| artist_aliases         | alias_name          | text                     | NO          | null                                      |
| artist_aliases         | normalized_alias    | text                     | NO          | null                                      |
| artist_aliases         | created_at          | timestamp with time zone | NO          | now()                                     |
| artists                | id                  | bigint                   | NO          | nextval('artists_id_seq'::regclass)       |
| artists                | name                | text                     | NO          | null                                      |
| artists                | genre               | text                     | YES         | null                                      |
| artists                | created_at          | timestamp with time zone | YES         | now()                                     |
| artists                | normalized_name     | text                     | YES         | null                                      |
| artists                | artist_type         | text                     | YES         | null                                      |
| artists                | image_url           | text                     | YES         | null                                      |
| festival_artists       | festival_id         | bigint                   | NO          | null                                      |
| festival_artists       | artist_id           | bigint                   | NO          | null                                      |
| festival_artists       | performance_date    | date                     | YES         | null                                      |
| festival_artists       | performance_time    | time without time zone   | YES         | null                                      |
| festival_artists       | stage_name          | text                     | YES         | null                                      |
| festival_artists       | status              | text                     | YES         | 'confirmed'::text                         |
| festival_artists       | source_url          | text                     | YES         | null                                      |
| festival_artists       | created_at          | timestamp with time zone | YES         | now()                                     |
| festival_candidates    | id                  | bigint                   | NO          | null                                      |
| festival_candidates    | title               | text                     | NO          | null                                      |
| festival_candidates    | source_url          | text                     | NO          | null                                      |
| festival_candidates    | source_type         | text                     | YES         | null                                      |
| festival_candidates    | raw_text            | text                     | YES         | null                                      |
| festival_candidates    | festival_name       | text                     | YES         | null                                      |
| festival_candidates    | start_date          | date                     | YES         | null                                      |
| festival_candidates    | end_date            | date                     | YES         | null                                      |
| festival_candidates    | location            | text                     | YES         | null                                      |
| festival_candidates    | category            | text                     | YES         | null                                      |
| festival_candidates    | score               | integer                  | YES         | 0                                         |
| festival_candidates    | status              | text                     | NO          | 'pending'::text                           |
| festival_candidates    | reject_reason       | text                     | YES         | null                                      |
| festival_candidates    | reviewed_at         | timestamp with time zone | YES         | null                                      |
| festival_candidates    | created_at          | timestamp with time zone | YES         | now()                                     |
| festival_candidates    | updated_at          | timestamp with time zone | YES         | now()                                     |
| festival_candidates    | festival_id         | bigint                   | YES         | null                                      |
| festival_ticket_rounds | id                  | bigint                   | NO          | null                                      |
| festival_ticket_rounds | festival_id         | bigint                   | NO          | null                                      |
| festival_ticket_rounds | round_type          | text                     | YES         | null                                      |
| festival_ticket_rounds | round_name          | text                     | NO          | null                                      |
| festival_ticket_rounds | open_at             | timestamp with time zone | YES         | null                                      |
| festival_ticket_rounds | close_at            | timestamp with time zone | YES         | null                                      |
| festival_ticket_rounds | price_info          | text                     | YES         | null                                      |
| festival_ticket_rounds | ticket_url          | text                     | YES         | null                                      |
| festival_ticket_rounds | ticket_platform     | text                     | YES         | null                                      |
| festival_ticket_rounds | status              | text                     | NO          | 'scheduled'::text                         |
| festival_ticket_rounds | created_at          | timestamp with time zone | NO          | now()                                     |
| festival_ticket_rounds | updated_at          | timestamp with time zone | NO          | now()                                     |
| festivals              | id                  | bigint                   | NO          | nextval('festivals_id_seq'::regclass)     |
| festivals              | name                | text                     | NO          | null                                      |
| festivals              | start_date          | date                     | NO          | null                                      |
| festivals              | end_date            | date                     | NO          | null                                      |
| festivals              | location            | text                     | YES         | null                                      |
| festivals              | category            | text                     | YES         | null                                      |
| festivals              | description         | text                     | YES         | null                                      |
| festivals              | ticket_url          | text                     | YES         | null                                      |
| festivals              | ticket_platform     | text                     | YES         | null                                      |
| festivals              | price_info          | text                     | YES         | null                                      |
| festivals              | program_info        | text                     | YES         | null                                      |
| festivals              | source_url          | text                     | YES         | null                                      |
| festivals              | confidence_score    | integer                  | YES         | 60                                        |
| festivals              | verification_status | text                     | YES         | 'pending'::text                           |
| festivals              | created_at          | timestamp with time zone | YES         | now()                                     |
| festivals              | updated_at          | timestamp with time zone | YES         | now()                                     |
| festivals              | address             | text                     | YES         | null                                      |
| festivals              | region              | text                     | YES         | null                                      |
| festivals              | official_url        | text                     | YES         | null                                      |
| festivals              | status              | text                     | YES         | 'scheduled'::text                         |
| festivals              | thumbnail_url       | text                     | YES         | null                                      |
| festivals              | price_type          | text                     | YES         | null                                      |
| festivals              | slug                | text                     | YES         | null                                      |
| pipeline_runs          | id                  | bigint                   | NO          | nextval('pipeline_runs_id_seq'::regclass) |
| pipeline_runs          | started_at          | timestamp with time zone | YES         | now()                                     |
| pipeline_runs          | finished_at         | timestamp with time zone | YES         | null                                      |
| pipeline_runs          | status              | text                     | YES         | null                                      |
| pipeline_runs          | articles_added      | integer                  | YES         | null                                      |
| pipeline_runs          | notes               | text                     | YES         | null                                      |