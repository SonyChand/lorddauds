<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Component extends CI_Controller {
    public function __construct()
		{
			parent::__construct();
			// maintain();
			// include_once APPPATH . "../vendor/autoload.php";
			date_default_timezone_set('Asia/Jakarta');
		}
	public function dashboard()
	{
		$data = [
            'title' => 'Component - Dashboard',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/component/dashboard', $data);
            $this->load->view('templates/dashboard/footer');
        
	}
	public function portfolio()
	{
		$data = [
            'title' => 'Component - Portfolio',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/component/portfolio', $data);
            $this->load->view('templates/dashboard/footer');
        
	}
	public function home()
	{
		$data = [
            'title' => 'Component - Home',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/component/home', $data);
            $this->load->view('templates/dashboard/footer');
        
	}
		
        

}
