<?php
/**
 * Plugin Name: MeridianLink Multi-Retailer Link Rewriter
 * Plugin URI: https://github.com/meridianlink/wordpress-plugin
 * Description: Automatically localizes Amazon, Best Buy, and Walmart product links on your WordPress site using your personal MeridianLink instance.
 * Version: 1.0.0
 * Author: MeridianLink
 * Author URI: https://meridianlink.local
 * License: GPL-2.0+
 */

if (!defined('ABSPATH')) {
    exit;
}

class MeridianLink_Plugin {
    const OPTION_ENDPOINT = 'meridianlink_endpoint';
    const OPTION_TOKEN = 'meridianlink_api_token';
    const OPTION_GROUP = 'meridianlink_default_group';
    const OPTION_PRESERVE = 'meridianlink_preserve_attr';

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_client_rewriter'));
        add_filter('the_content', array($this, 'filter_post_content'));
    }

    public function add_admin_menu() {
        add_options_page(
            'MeridianLink Settings',
            'MeridianLink',
            'manage_options',
            'meridianlink',
            array($this, 'render_admin_page')
        );
    }

    public function register_settings() {
        register_setting('meridianlink_options', self::OPTION_ENDPOINT);
        register_setting('meridianlink_options', self::OPTION_TOKEN);
        register_setting('meridianlink_options', self::OPTION_GROUP);
        register_setting('meridianlink_options', self::OPTION_PRESERVE);
    }

    public function enqueue_client_rewriter() {
        $endpoint = get_option(self::OPTION_ENDPOINT, 'http://localhost:3000');
        $group = get_option(self::OPTION_GROUP, '');
        $preserve = get_option(self::OPTION_PRESERVE, '1') === '1' ? 'true' : 'false';

        $snippet_url = esc_url($endpoint . '/api/integrations/snippet?domain=' . urlencode($endpoint) . '&groupId=' . urlencode($group) . '&preserveAttribution=' . $preserve);

        wp_enqueue_script(
            'meridianlink-rewriter',
            $snippet_url,
            array(),
            '1.0.0',
            true
        );
    }

    public function filter_post_content($content) {
        // Transparently processes standard content without modifying raw database entries
        return $content;
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>MeridianLink Multi-Retailer Configuration</h1>
            <p>Connect your self-hosted or cloud MeridianLink smart link redirect server.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields('meridianlink_options');
                do_settings_sections('meridianlink_options');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">MeridianLink Server URL</th>
                        <td>
                            <input type="url" name="<?php echo self::OPTION_ENDPOINT; ?>" value="<?php echo esc_attr(get_option(self::OPTION_ENDPOINT, 'http://localhost:3000')); ?>" class="regular-text" required />
                            <p class="description">e.g. <code>https://links.mybrand.com</code></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Personal API Token</th>
                        <td>
                            <input type="password" name="<?php echo self::OPTION_TOKEN; ?>" value="<?php echo esc_attr(get_option(self::OPTION_TOKEN)); ?>" class="regular-text" />
                            <p class="description">Generated in MeridianLink under Integrations &gt; API Tokens with <code>links:write</code> scope.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Default Attribution Group</th>
                        <td>
                            <input type="text" name="<?php echo self::OPTION_GROUP; ?>" value="<?php echo esc_attr(get_option(self::OPTION_GROUP)); ?>" class="regular-text" />
                            <p class="description">Optional Group ID or slug to attribute clicks to.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save MeridianLink Configuration'); ?>
            </form>
        </div>
        <?php
    }
}

new MeridianLink_Plugin();
