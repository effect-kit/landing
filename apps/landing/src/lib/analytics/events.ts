/**
 * Every product event the site sends, with its properties. Components call `track()` with one of
 * these names, so event names and property shapes cannot drift from the dashboards built on them.
 *
 * Naming: `object_verb`, snake_case, past tense. Properties are snake_case.
 */

export type Location =
  | "header"
  | "footer"
  | "hero"
  | "closing"
  | "packages"
  | "section"
  | "docs"
  | "not_found"
  | "error"
  | "blog";

export type PlaygroundOutcome = "succeeded" | "failed" | "interrupted" | "died";

export interface AnalyticsEvents {
  // Landing pages
  section_viewed: { section_id: string; section_index: number };
  cta_clicked: { cta: string; location: Location; href: string };
  nav_link_clicked: { location: Location; target: string };
  outbound_link_clicked: { destination: string; host: string; location: Location };
  code_copied: {
    snippet_id: string;
    surface: "code_window" | "playground" | "docs";
    lines: number;
  };
  install_command_copied: { package_manager: string; packages: string; option_id: string };
  package_manager_selected: { package_manager: string; previous: string };
  copy_failed: { surface: string };
  api_tour_step_viewed: { step_id: string; index: number; cause: "auto" | "click" };
  layer_stack_step_reached: { step_id: string; index: number };
  runtime_selected: { runtime: string; previous: string };
  provider_selected: { provider: string; previous: string };
  idempotency_demo_run: { provider: string; second_send_accepted: boolean };
  template_mode_changed: { mode: string };
  cluster_keys_changed: { same_slot: boolean; has_hash_tag: boolean; via: "preset" | "typed" };
  figure_interacted: { figure: string; action: string; value?: string | number | boolean };

  // Playground
  playground_viewed: { category: string; example_id: string };
  playground_example_selected: { example_id: string; category: string; api: string };
  playground_control_changed: {
    example_id: string;
    kind: "control" | "condition";
    value: string;
    previous: string;
  };
  playground_run_started: {
    example_id: string;
    control_value: string;
    condition_value: string;
    run_index: number;
  };
  playground_run_completed: {
    example_id: string;
    outcome: PlaygroundOutcome;
    error_tag?: string;
    duration_ms: number;
    control_value: string;
    condition_value: string;
  };
  playground_run_stopped: { example_id: string; elapsed_ms: number };
  playground_run_abandoned: { example_id: string; reason: "scrolled_away" | "control_changed" };
  sound_toggled: { enabled: boolean };

  // Docs
  docs_page_viewed: { package: string; slug: string; title: string };
  docs_scroll_depth_reached: { percent: 25 | 50 | 75 | 100; slug: string };
  docs_code_copied: { slug: string; language: string; lines: number; is_twoslash: boolean };
  docs_type_hovered: { slug: string; identifier: string };
  docs_markdown_copied: { slug: string };
  docs_view_option_clicked: { option: string; slug: string };
  docs_search_opened: { trigger: "button" | "hotkey"; package: string };
  docs_search_performed: {
    query: string;
    query_length: number;
    result_count: number;
    package: string;
  };
  docs_search_result_clicked: { result_url: string; rank: number; query_length: number };
  docs_package_switched: { from: string; to: string };
  docs_toc_clicked: { slug: string; heading: string };
  docs_outbound_clicked: { slug: string; host: string };
  theme_changed: { theme: string };
  changelog_viewed: { package: string; page: number; release_count: number; unavailable: boolean };
  changelog_release_clicked: { package: string; release: string };

  // Blog
  blog_post_clicked: {
    slug: string;
    surface: "featured" | "list" | "related" | "adjacent" | "series";
  };
  blog_filter_changed: { category: string; previous: string };
  blog_share_clicked: { slug: string; network: "x" | "linkedin" | "bluesky" | "copy" };
  blog_toc_clicked: { slug: string; heading: string };

  // Site-wide
  page_not_found: { path: string; referrer_host: string };
  route_error: { path: string; message: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;
